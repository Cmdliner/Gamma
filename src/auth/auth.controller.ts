import type { Request, Response } from "express";
import type { IRegisterUser } from "../types/user.dto";
import { registerValidationSchema } from "../validations/auth.validation";
import { Types } from "mongoose";
import Settings from "../config/settings";
import EmailService from "../emails/email.service";
import User from "../user/user.model";
import OTP from "./auth.model";
import generateOTP from "../lib/otp";
import jwt, { type JwtPayload } from "jsonwebtoken";
import * as bcrypt from "bcryptjs";
import AuthService from "./auth.service";

const { ACCESS_TOKEN_SECRET, ONBOARDING_TOKEN_SECRET } = Settings;


class AuthController {

    private static async createToken(payload: Types.ObjectId, secret: string, expiry: string | number) {
        return jwt.sign({ id: payload }, secret, { expiresIn: expiry });
    }

    // Register 
    static async register(req: Request, res: Response) {
        try {
            const {
                first_name,
                last_name,
                dob, email,
                gender, referral_code,
                state_of_origin,
                phone_no_1, phone_no_2
            }: IRegisterUser = req.body;

            if (!req.body.interested_categories) req.body.interested_categories = "others";
            const registerInfo: Partial<IRegisterUser> = { first_name, last_name, dob, email, gender, state_of_origin, interested_categories: req.body.interested_categories };
            const phone_numbers = [phone_no_1];
            if (phone_no_2) phone_numbers.push(phone_no_2);

            const { error } = registerValidationSchema.validate({ ...registerInfo, phone_numbers });
            if (error) {
                return res.status(422).json({ error: error.details[0].message });
            }

            const emailTaken = await User.exists({ email });
            if (emailTaken) return res.status(422).json({ error: "Email taken!" });

            let referrer = null;
            if (referral_code) {
                referrer = await User.findOne({ referral_code });
                if (!referrer) return res.status(404).json({ error: "Invalid referral code!" });
            }
            const user = new User(registerInfo);
            if (!user) return res.status(400).json({ error: "Error registering user" });

            // Add use phone numbers
            user.phone_numbers = phone_numbers;

            const referralCode = await AuthService.generateUniqueReferralCode();
            if(!referralCode) throw new Error("Error creating referral code");
            user.referral_code = referralCode;

            // Check if there is a valid referrer and add new user to list of referrals if true
            if (referrer) referrer.referrals.push(user._id);

            const emailVToken = new OTP({ kind: "verification", owner: user._id, token: generateOTP() });
            if (!emailVToken) {
                return res.status(400).json({ error: "Error sending verification mail" });
            }
            const full_name = `${first_name} ${last_name}`;
            await EmailService.sendVerificationEmail(email, full_name, emailVToken.token!);

            const userToken = await AuthController.createToken(user._id, ONBOARDING_TOKEN_SECRET, "7d");
            req.unverified_user = { id: userToken }; //Why did i do this?

            res.setHeader("x-onboarding-user", req.unverified_user.id);

            // when all the register operations have successfully completed commit the transactions to the db
            if (referrer) await referrer.save();
            await emailVToken.save();
            await user.save();

            return res.status(201).json({ success: "User created successfully!", user });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Error registering user" });
        }
    }

    // Resend verification email
    static async resendVerificationMail(req: Request, res: Response) {
        try {
            const { email } = req.body;
            const user = await User.findOne({ email });
            if (!user) return res.status(404).json({ error: "Email not found!" });

            // Find and delete previous otp
            await OTP.findOneAndDelete({ kind: "verification", owner: user._id });

            const emailVToken = new OTP({ kind: "verification", owner: user._id, token: generateOTP() });
            if (!emailVToken) {
                return res.status(400).json({ error: "Error sending verification mail" });
            }
            const full_name = `${user.first_name} ${user.last_name}`;
            await EmailService.sendVerificationEmail(email, full_name, emailVToken.token);

            const userToken = await AuthController.createToken(user._id, ONBOARDING_TOKEN_SECRET, "7d");
            req.unverified_user = { id: userToken };

            res.setHeader("x-onboarding-user", req.unverified_user.id);

            await emailVToken.save();
            await user.save();

            return res.status(200).json({ success: "Verification email sent successfully" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Error sending verification email" });
        }
    }

    // Email verification
    static async verifyEmail(req: Request, res: Response) {
        try {
            const { otp } = req.body;
            const unverifiedUserToken = req.headers["x-onboarding-user"] as string;

            const decodedToken = jwt.verify(unverifiedUserToken, ONBOARDING_TOKEN_SECRET) as any as JwtPayload;
            if (!decodedToken) return res.status(403).json({ error: "Error authenticating user!" });

            const user = await User.findById(decodedToken.id);
            if (!user) return res.status(404).json({ error: "User not found!" });

            const OTPinDb = await OTP.findOne({ token: otp });
            if (!OTPinDb) return res.status(404).json({ error: "OTP not found!" });

            // ensure otp is not expired
            if (OTPinDb.expires.valueOf() < new Date().valueOf()) {
                return res.status(400).json({ error: "OTP expired!" });
            }
            const userVerificationOTP = await OTP.findOneAndDelete({ kind: "verification", owner: user._id, token: otp });
            if (!userVerificationOTP) return res.status(400).json({ error: "Invalid OTP!" });
            if (!user.email_verified) {
                user.email_verified = true;
                await user.save();
            }
            return res.status(200).json({ success: "User verification successful" });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Error verifying email" });
        }
    }

    // Set password
    static async setPassword(req: Request, res: Response) {
        try {
            const { password } = req.body;
            const userToken = req.headers?.["x-onboarding-user"] as string;

            const decodedToken = jwt.verify(userToken, ONBOARDING_TOKEN_SECRET) as JwtPayload;
            if (!decodedToken) return res.status(403).json({ error: "Error authenticating user!" });

            const user = await User.findById(decodedToken.id);
            if (!user) return res.status(404).json({ error: "User not found!" });

            const hashedPassword = await bcrypt.hash(password, 10);
            if (!hashedPassword) {
                return res.status(400).json({ error: "Error creating password" });
            }
            user.password = hashedPassword;
            await user.save();

            return res.status(200).json({ success: "Password created successfully" });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal server error" });
        }

    }

    // kyc
    static async verifyBVN(req: Request, res: Response) { }

    // bank account details
    static async addBankDetails() { }

    // Forgot password
    static async generatePasswordResetToken(req: Request, res: Response) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ error: "Email required!" });
            }
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ error: "No user found for that email address" });
            }
            // Delete any previous reset tokens
            await OTP.findOneAndDelete({ kind: "password_reset", owner: user._id });
            const resetPasswordOTP = new OTP({ kind: "password_reset", owner: user._id, token: generateOTP() });

            const full_name = `${user.first_name} ${user.last_name}`
            await EmailService.sendPasswordResetToken(email, full_name, resetPasswordOTP.token);

            await resetPasswordOTP.save();
            user.save();

            return res.status(200).json({ success: "A password reset token has been sent to your email" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "An error occured while trying to reset password" });
        }

    }

    // Verify reset password OTP
    static async verifyResetPwdOTP(req: Request, res: Response) {
        try {
            const { otp, email } = req.body;

            const user = await User.findOne({ email })
            if (!user) return res.status(422).json({ error: "Error verifying otp!" });

            const OTPinDb = await OTP.findOneAndDelete({ owner: user._id, token: otp });
            if (!OTPinDb) return res.status(403).json({ error: "OTP verification failed!" });

            if (OTPinDb.expires.valueOf() < Date.now().valueOf()) {
                return res.status(400).json({ error: "OTP expired!" });
            }

            const authToken = await AuthController.createToken(user._id, ACCESS_TOKEN_SECRET, "30d");
            res.setHeader("Authorization", `Bearer ${authToken}`);
            return res.status(200).json({ success: "OTP verification successful!" });


        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Error verifying OTP!" });
        }
    }

    // Reset password
    static async resetPassword(req: Request, res: Response) {
        try {
            const { password } = req.body;
            const authToken = req.headers.authorization?.toString().split(" ")[1];
            if (!authToken) return res.status(401).json({ error: "Error authenticating user" });

            const decoded = jwt.verify(authToken, ACCESS_TOKEN_SECRET) as any as JwtPayload;
            if (!decoded) return res.status(401).json({ error: "Error authenticating user!" });

            const user = await User.findById(decoded.id);
            if (!user) return res.status(404).json({ error: "User not found" });

            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
            await user.save();

            return res.status(200).json({ success: "Password reset successful" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Error reseting password" });
        }

    }

    // Sign in
    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(422).json({ error: `${email ? "password" : "email"} required for sign in` });
            }

            const user = await User.findOne({ email });
            if (!user) return res.status(404).json({ error: "Incorrect username or password!" });

            const passwordsMatch = await bcrypt.compare(password, user.password as string);
            if (!passwordsMatch) return res.status(403).json({ error: "Invalid username or password!" });

            if (!user.bvn_verified || !user.account_verified || !user.email_verified) {
                return res.status(403).json({ error: "Cannot skip onboarding process" });
            }
            const authToken = await AuthController.createToken(user._id, ACCESS_TOKEN_SECRET, "30d");
            res.setHeader("Authorization", `Bearer ${authToken}`);

            return res.status(200).json({ success: "Login successful" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Error signing in user" });
        }
    }
}

export default AuthController;