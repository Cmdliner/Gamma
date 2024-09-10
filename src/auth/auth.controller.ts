import { type Request, type Response } from "express";
import { IRegisterUser } from "../types/User";
import { registerValidationSchema } from "../validations/auth.validation";
import { Types } from "mongoose";
import Settings from "../config/settings";
import EmailService from "../emails/email.service";
import PhoneNumber from "../user/phone_number.model";
import User from "../user/user.model";
import OTP from "./auth.model";
import generateOTP from "../lib/otp";
import jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";

const { ACCESS_TOKEN_SECRET } = Settings;
class AuthController {

    private static async createToken(payload: Types.ObjectId, secret: string, expiry: string | number) {
        return jwt.sign({ id: payload }, secret, { expiresIn: expiry });
    }

    // Register 
    static async register(req: Request, res: Response) {
        try {
            const {
                firstname,
                lastname,
                dob, email,
                gender, referral_code,
                state_of_origin,
                phone_no_1, phone_no_2
            }: IRegisterUser = req.body;

            const registerInfo: Partial<IRegisterUser> = { firstname, lastname, dob, email, gender, state_of_origin };

            const { error } = registerValidationSchema.validate(registerInfo);
            if (error) {
                return res.status(422).json({ error: error.details[0].message });
            }

            const emailTaken = await User.exists({ email });
            if (emailTaken) return res.status(422).json({ error: "Email taken!" });

            let referrer = null;
            if (referral_code) {
                referrer = await User.findOne({ referral_code });
                if (!referrer) {
                    return res.status(404).json({ error: "Invalid referral code!" });
                }
                registerInfo.referral_code = referral_code;
            }

            const user = new User(registerInfo);
            if (!user) return res.status(400).json({ error: "Error registering user" });

            // Check if there is a valid referrer and add new user to list of referrals if true
            if (referrer) {
                referrer.referrals.push(user._id);
                await referrer.save();
            }

            //! TODO => Validate phone no
            let phoneNumbers = await PhoneNumber.insertMany(
                [{ value: phone_no_1 }, { value: phone_no_2 }]
            );

            if (!phoneNumbers) {
                return res.status(400).json({ error: "Error adding phone numbers" });
            }
            phoneNumbers = phoneNumbers.flatMap(phoneNo => phoneNo._id) as any;
            user.phone_numbers = phoneNumbers as any;

            const emailVToken = new OTP({ kind: "verification", owner: user._id, token: generateOTP() });
            if (!emailVToken) {
                return res.status(400).json({ error: "Error sending verification mail" });
            }
            const fullname = `${lastname} ${firstname}`;
            await EmailService.sendVerificationEmail(email, fullname, emailVToken.token!);

            const userToken = await AuthController.createToken(user._id, ACCESS_TOKEN_SECRET as string, "7d");
            req.unverified_user = { id: userToken };

            res.setHeader("x-onboarding-user", req.unverified_user.id);

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

            // find and delete previous otp
            await OTP.findOneAndDelete({ kind: "verification", owner: user._id });

            const emailVToken = new OTP({ kind: "verification", owner: user._id, token: generateOTP() });
            if (!emailVToken) {
                return res.status(400).json({ error: "Error sending verification mail" });
            }
            const fullname = `${user.firstname} ${user.lastname}`;
            await EmailService.sendVerificationEmail(email, fullname, emailVToken.token!);

            const userToken = await AuthController.createToken(user._id, ACCESS_TOKEN_SECRET, "7d");
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
            const unverifiedUserToken = req.headers["x-onboarding-user"]?.toString();
            if (!unverifiedUserToken) {
                return res.status(401).json({ error: "Error authenticating user!" })
            }

            const decodedToken = jwt.verify(unverifiedUserToken, ACCESS_TOKEN_SECRET) as any
            if (!decodedToken) return res.status(403).json({ error: "Error authenticating user!" });

            const user = await User.findById(decodedToken.id);
            if (!user) return res.status(403).json({ error: "User not found!" });

            const userVerificationOTP = await OTP.findOneAndDelete({ kind: "verification", owner: user._id, token: otp });
            if (!userVerificationOTP) return res.status(400).json({ error: "Invalid OTP!" });
            if (!user.isVerified) {
                user.isVerified = true;
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
            const userToken = req.headers?.["x-onboarding-user"]?.toString() || "";
            if (!userToken) return res.status(401).json({ error: "Error authenticating user!" });

            const decodedToken = jwt.verify(userToken, ACCESS_TOKEN_SECRET) as any;
            if (!decodedToken) return res.status(403).json({ error: "Error authenticating user!" });

            const user = await User.findById(decodedToken.id);
            if (!user) {
                return res.status(404).json({ error: "User not found!" });
            }
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
    static async verifyBVN() { }

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
            const resetPasswordOTP = new OTP({ kind: "password_reset", owner: user._id, token: generateOTP() });

            const fullname = `${user.firstname} ${user.lastname}`
            await EmailService.sendPasswordResetToken(email, fullname, resetPasswordOTP.token);

            await resetPasswordOTP.save();
            user.save();

            return res.status(200).json({ success: "A password reset token as been sent to your email" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "An error occured while trying to reset password" });
        }

    }

    // Reset password
    static async resetPassword(req: Request, res: Response) {
        // const req.user.id
    }
}

export default AuthController;