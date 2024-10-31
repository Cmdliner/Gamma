import type { Request, Response } from "express";
import type { IRegisterUser } from "../types/user.dto";
import { registerValidationSchema } from "../validations/auth.validation";
import { startSession, Types } from "mongoose";
import jwt, { type JwtPayload } from "jsonwebtoken";
import Settings from "../config/settings";
import EmailService from "../lib/email.service";
import User from "../user/user.model";
import OTP from "./auth.model";
import * as bcrypt from "bcryptjs";
import AuthService from "./auth.service";
import Wallet from "../user/wallet.model";
import { generateOTP, validateBvnUsingLuhnsAlgo } from "../lib/main";
import PaystackService from "../lib/paystack.service";
import { BankCodes, IBankInfo } from "../lib/bank_codes";

const { ACCESS_TOKEN_SECRET, ONBOARDING_TOKEN_SECRET } = Settings;


class AuthController {

    // Register 
    static async register(req: Request, res: Response) {
        // const session = await startSession();
        try {
            // session.startTransaction();
            const {
                first_name,
                last_name, middle_name,
                dob, email,
                gender, referral_code,
                state_of_origin, location,
                interested_categories,
                phone_no_1, phone_no_2
            }: IRegisterUser = req.body;

            const registerInfo: Partial<IRegisterUser> = { first_name, last_name, dob, email, gender, state_of_origin, interested_categories };

            // Add error that checks that at least we have a phone number 1 field
            if (!phone_no_1) {
                return res.status(422).json({ error: "At least one phone number is required" });
            }
            // Add middle name and location if present
            if (middle_name) registerInfo.middle_name = middle_name;
            if (location) registerInfo.location = location;

            const phone_numbers = [phone_no_1];
            if (phone_no_2) phone_numbers.push(phone_no_2);

            const { error } = registerValidationSchema.validate({ ...registerInfo, phone_numbers });
            if (error) {
                return res.status(422).json({ error: true, message: error.details[0].message });
            }

            const emailTaken = await User.exists({ email })//.session(session);
            if (emailTaken) return res.status(422).json({ error: true, message: "Email taken!" });

            let referrer = null;
            if (referral_code) {
                referrer = await User.findOne({ referral_code })//.session(session);
                if (!referrer) return res.status(404).json({ error: true, message: "Invalid referral code!" });
            }
            const user = new User(registerInfo);
            if (!user) return res.status(400).json({ error: true, message: "Error registering user" });

            // Add user phone numbers
            user.phone_numbers = phone_numbers;

            const referralCode = await AuthService.generateUniqueReferralCode();
            if (!referralCode) throw new Error("Error creating referral code");
            user.referral_code = referralCode;

            // Check if there is a valid referrer and add new user to list of referrals if true
            if (referrer) {
                referrer.referrals.push(user._id);
                await referrer.save();
            }

            // Create user wallet
            const wallet = new Wallet();
            if (!wallet) throw { custom_error: true, message: "Error creating user" };
            user.wallet = wallet._id as Types.ObjectId;
            await wallet.save();
            await user.save();


            const emailVToken = new OTP({ kind: "verification", owner: user._id, token: generateOTP() });
            if (!emailVToken) {
                return res.status(400).json({ error: true, message: "Error sending verification mail" });
            }
            const full_name = `${first_name} ${last_name}`;
            await EmailService.sendVerificationEmail(email, full_name, emailVToken.token!);
            await emailVToken.save();

            const userToken = await AuthService.createToken(user._id, ONBOARDING_TOKEN_SECRET, "7d");
            const unverified_user = { id: userToken }; //Why did i do this?

            res.setHeader("x-onboarding-user", unverified_user.id);

            // when all the register operations have successfully completed commit the transactions to the db
            //await session.commitTransaction();

            return res.status(201).json({ success: true, message: "User created successfully!", user });

        } catch (error) {
            // await session.abortTransaction();
            console.error(error);
            return res.status(500).json({ error: true, message: "Error registering user" });
        }
    }

    // Resend verification email
    static async resendVerificationMail(req: Request, res: Response) {
        try {
            const { email } = req.body;
            const user = await User.findOne({ email });
            if (!user) return res.status(404).json({ error: true, message: "Email not found!" });

            // Find and delete previous otp
            await OTP.findOneAndDelete({ kind: "verification", owner: user._id });

            const emailVToken = new OTP({ kind: "verification", owner: user._id, token: generateOTP() });
            if (!emailVToken) {
                return res.status(400).json({ error: true, message: "Error sending verification mail" });
            }
            const full_name = `${user.first_name} ${user.last_name}`;
            await EmailService.sendVerificationEmail(email, full_name, emailVToken.token);

            const userToken = await AuthService.createToken(user._id, ONBOARDING_TOKEN_SECRET, "7d");
            const unverified_user = { id: userToken };

            res.setHeader("x-onboarding-user", unverified_user.id);

            await emailVToken.save();
            await user.save();

            return res.status(200).json({ success: true, message: "Verification email sent successfully" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error sending verification email" });
        }
    }

    // Email verification
    static async verifyEmail(req: Request, res: Response) {
        try {
            const { otp } = req.body;
            if (!otp) {
                return res.status(422).json({ error: true, message: "OTP required!" });
            }
            const unverifiedUserToken = req.headers["x-onboarding-user"] as string;

            const decodedToken = jwt.verify(unverifiedUserToken, ONBOARDING_TOKEN_SECRET) as any as JwtPayload;
            if (!decodedToken) return res.status(403).json({ error: true, message: "Error authenticating user!" });

            const user = await User.findById(decodedToken.id);
            if (!user) return res.status(404).json({ error: true, message: "User not found!" });

            const otpInDb = await OTP.findOne({ token: otp });
            if (!otpInDb) return res.status(404).json({ error: true, message: "OTP not found!" });

            // ensure otp is not expired
            if (otpInDb.expires.valueOf() < new Date().valueOf()) {
                return res.status(400).json({ error: true, message: "OTP expired!" });
            }
            const userVerificationOTP = await OTP.findOneAndDelete({ kind: "verification", owner: user._id, token: otp });
            if (!userVerificationOTP) return res.status(400).json({ error: true, message: "Invalid OTP!" });
            if (!user.email_verified) {
                user.email_verified = true;
                await user.save();
            }
            return res.status(200).json({ success: true, message: "User verification successful" });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error verifying email" });
        }
    }

    // Set password
    static async setPassword(req: Request, res: Response) {
        try {
            const { password } = req.body;
            const userToken = req.headers?.["x-onboarding-user"] as string;

            const decodedToken = jwt.verify(userToken, ONBOARDING_TOKEN_SECRET) as JwtPayload;
            if (!decodedToken) return res.status(403).json({ error: true, message: "Error authenticating user!" });

            const user = await User.findById(decodedToken.id);
            if (!user) return res.status(404).json({ error: true, message: "User not found!" });

            const hashedPassword = await bcrypt.hash(password, 10);
            if (!hashedPassword) {
                return res.status(400).json({ error: true, message: "Error creating password" });
            }
            user.password = hashedPassword;
            await user.save();

            return res.status(200).json({ success: true, message: "Password created successfully" });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Internal server error" });
        }

    }

    // kyc
    static async verifyBVN(req: Request, res: Response) {
        try {
            const { bvn }: { bvn: string } = req.body;
            if (!bvn) {
                return res.status(422).json({ error: true, message: "BVN required!" });
            }

            // Sanitize the bvn make sure it is required no of digits and all numerical
            const isBvnDigit = /^\d$/.test(bvn);
            if (bvn.length !== 11 || isBvnDigit) {
                return res.status(422).json({ error: true, message: "Imvalid bvn" });
            }

            // Verify onboarding token and check if user is valid
            const unverifiedUserToken = req.headers["x-onboarding-user"] as string;

            const decodedToken = jwt.verify(unverifiedUserToken, ONBOARDING_TOKEN_SECRET) as any as JwtPayload;
            if (!decodedToken) return res.status(403).json({ error: true, message: "Error authenticating user!" });

            const user = await User.findById(decodedToken.id);
            if (!user) return res.status(404).json({ error: true, message: "User not found!" });

            // Check if bvn is valid using Luhn's algo
            const isValidBvn = validateBvnUsingLuhnsAlgo(bvn);
            if (!isValidBvn) {
                return res.status(400).json({ error: true, message: "Invalid BVN" });
            }

            // use paystack bvn api to resolve bvn details and error if invalid details
            await PaystackService.resolveBvn(parseInt(bvn));


            user.bvn = { verification_status: "verified", verified_at: new Date() };
            await user.save();

            return res.status(200).json({ success: true, message: "Bvn verification successful" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "An error occured during bvn verification" })
        }

    }

    // Get bank codes
    static async getBankCodes(req: Request, res: Response) {
        const { q } = req.query;
        const searchPattern = new RegExp(`${q}`, "i");

        const matchedBanks = BankCodes.filter((bankCode: IBankInfo) => bankCode.name.match(searchPattern));
        if (matchedBanks) {
            console.log("MAtched");
            return res.status(200).json({ success: true, banks: matchedBanks });
        }
        return res.status(200).json({ success: true, banks: BankCodes });
    }

    // bank account details
    static async validateBankDetails(req: Request, res: Response) {
        try {
            const { account_no, bank_code } = req.body;

            if (!account_no || !bank_code) {
                return res
                    .status(422)
                    .json({ error: true, message: `${account_no ? "Bank code" : "Account no"} is required` });
            }

            // Verify onboarding token and check if user is valid
            const unverifiedUserToken = req.headers["x-onboarding-user"] as string;

            const decodedToken = jwt.verify(unverifiedUserToken, ONBOARDING_TOKEN_SECRET) as any as JwtPayload;
            if (!decodedToken) return res.status(403).json({ error: true, message: "Error authenticating user!" });

            const user = await User.findById(decodedToken.id);
            if (!user) return res.status(404).json({ error: true, message: "User not found!" });


            // Validate bank account with paystack
            const isValidBankAcc = await PaystackService.validateAccountDetails(account_no, bank_code)
            if (!isValidBankAcc) {
                return res.status(400).json({ error: true, message: "Invalid bank details " })
            }

            user.account_details = { account_no, bank_code, added_at: new Date() };
            await user.save();

            return res.status(200).json({ success: true, message: "Bank details added successfully" });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error adding bank account details" })
        }
    }

    // Forgot password
    static async generatePasswordResetToken(req: Request, res: Response) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(422).json({ error: true, message: "Email required!" });
            }
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ error: true, message: "Email not found" });
            }

            // Delete any previous reset tokens
            await OTP.findOneAndDelete({ kind: "password_reset", owner: user._id });
            const resetPasswordOTP = new OTP({ kind: "password_reset", owner: user._id, token: generateOTP() });

            const full_name = `${user.first_name} ${user.last_name}`
            await EmailService.sendPasswordResetToken(email, full_name, resetPasswordOTP.token);

            await resetPasswordOTP.save();

            return res.status(200).json({ success: true, message: "A password reset token has been sent to your email" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "An error occured while trying to reset password" });
        }

    }

    // Verify reset password OTP
    static async verifyResetPwdOTP(req: Request, res: Response) {
        try {
            const { otp, email } = req.body;

            if (!otp || !email) {
                return res.status(422).json({ error: true, message: "Email and otp token required!" });
            }

            const user = await User.findOne({ email });
            if (!user) return res.status(422).json({ error: true, message: "Error verifying otp!" });

            const otpInDb = await OTP.findOneAndDelete({ owner: user._id, token: otp });
            if (!otpInDb) return res.status(403).json({ error: true, message: "OTP verification failed!" });

            if (otpInDb.expires.valueOf() < Date.now().valueOf()) {
                return res.status(400).json({ error: true, message: "OTP expired!" });
            }

            const authToken = await AuthService.createToken(user._id, ACCESS_TOKEN_SECRET, "30d");
            res.setHeader("Authorization", `Bearer ${authToken}`);
            return res.status(200).json({ success: true, message: "OTP verification successful!" });


        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error verifying OTP!" });
        }
    }

    // Reset password
    static async resetPassword(req: Request, res: Response) {
        try {
            const { password } = req.body;
            if (!password) {
                return res.status(422).json({ error: true, message: "Password required!" });
            }
            const authToken = req.headers.authorization?.toString().split(" ")[1];
            if (!authToken) return res.status(401).json({ error: true, message: "Error authenticating user" });

            const decoded = jwt.verify(authToken, ACCESS_TOKEN_SECRET) as any as JwtPayload;
            if (!decoded) return res.status(401).json({ error: true, message: "Error authenticating user!" });

            const user = await User.findById(decoded.id);
            if (!user) return res.status(404).json({ error: true, message: "User not found" });
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
            await user.save();

            return res.status(200).json({ success: true, message: "Password reset successful" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error reseting password" });
        }

    }

    // Sign in
    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(422).json({ error: true, message: `${email ? "password" : "email"} required for sign in` });
            }

            const user = await User.findOne({ email });
            if (!user) return res.status(404).json({ error: true, message: "Incorrect username or password!" });

            const passwordsMatch = await bcrypt.compare(password, user.password as string);
            if (!passwordsMatch) return res.status(403).json({ error: true, message: "Invalid username or password!" });

            if (user.bvn?.verification_status !== "verified" || !user.account_details || !user.email_verified) {
                return res.status(403).json({ error: true, message: "Cannot skip onboarding process" });
            }
            const authToken = await AuthService.createToken(user._id, ACCESS_TOKEN_SECRET, "30d");
            res.setHeader("Authorization", `Bearer ${authToken}`);

            return res.status(200).json({ success: true, message: "Login successful" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error signing in user" });
        }
    }

    // Refresh access token
    static async refresh(req: Request, res: Response) {
        try {
            const refreshCookie = req.cookies.refresh as string;
            const [_, refreshToken] = refreshCookie.split(" ");
            if (!refreshCookie || !refreshToken) {
                return res.status(401).json({ error: true, message: "Unauthorized" });
            }
            // Validate refresh token
            const decoded = jwt.verify(refreshToken, "TEMP_REFRESH_SECRET") as JwtPayload;
            if (!decoded) return res.status(403).json({ error: true, message: "Refresh token expired" });

            const user = await User.exists({ _id: decoded.id });
            if (!user) return res.status(404).json({ error: true, message: "User not found!" });

            //Create new access token
            const accessToken = await AuthService.createToken(user._id, process.env.ACCESS_TOKEN_SECRET, "30d")
            res.setHeader("Authorization", `Bearer ${accessToken}`);

            return res.status(200).json({ success: true, message: "Access refreshed" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Internal server error" });
        }
    }
}

export default AuthController;