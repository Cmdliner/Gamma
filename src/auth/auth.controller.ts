import type { Request, Response } from "express";
import type { IRegisterUser } from "../types/user.dto";
import { PasswordValidationSchema, registerValidationSchema } from "../validations/auth.validation";
import { startSession, Types } from "mongoose";
import jwt, { type JwtPayload } from "jsonwebtoken";
import EmailService from "../lib/email.service";
import User from "../user/user.model";
import OTP from "./otp.model";
import * as bcrypt from "bcryptjs";
import AuthService from "./auth.service";
import Wallet from "../user/wallet.model";
import { encryptBvn, generateOTP, hashBvn, isValidState, matchAccNameInDb } from "../lib/utils";
import PaystackService from "../lib/paystack.service";
import { BankCodes, IBankInfo } from "../lib/bank_codes";
import FincraService from "../lib/fincra.service";
import { GeospatialDataNigeria } from "../lib/location.data";
import { cfg } from "../init";


class AuthController {

    // Register 
    static async register(req: Request, res: Response) {

        const session = await startSession();

        try {
            session.startTransaction();
            const {
                first_name,
                last_name, middle_name,
                dob, email,
                gender, referral_code,
                state_of_origin, interested_categories,
                phone_no_1, phone_no_2
            }: IRegisterUser = req.body;

            const registerInfo: Partial<IRegisterUser> = {
                first_name,
                last_name,
                dob,
                email: email.trim().toLowerCase(),
                gender,
                state_of_origin,
                interested_categories,
            };

            // Add error that checks that at least we have a phone number 1 field
            if (!phone_no_1) {
                await session.abortTransaction();
                return res.status(422).json({ error: true, message: "At least one phone number is required" });
            }
            // Add middle name and location if present
            if (middle_name) registerInfo.middle_name = middle_name;

            // ! MODIFY WITH CAUTION;
            // !! ESSENTIAL FOR GEOSPATIAL LOCATION TRACKING
            const DEFAULT_LOCATION = "lagos";
            const humanReadableLocation = req.body.location ? req.body.location as string : DEFAULT_LOCATION;
            if (humanReadableLocation) {
                if (!isValidState(humanReadableLocation)) {
                    await session.abortTransaction();
                    return res.status(422).json({ error: true, message: "Invalid location format" });
                }
                const location: {
                    type: "Point";
                    human_readable: string;
                    coordinates: [number, number];
                } = {
                    human_readable: humanReadableLocation,
                    coordinates: [
                        GeospatialDataNigeria[humanReadableLocation].lat,
                        GeospatialDataNigeria[humanReadableLocation].long,
                    ],
                    type: "Point"
                };
                registerInfo.location = location;
            }

            const phone_numbers = [phone_no_1];
            if (phone_no_2) phone_numbers.push(phone_no_2);

            // Verify that no user has any of the phone numbers before
            const phoneNumberInUse = await User.findOne({ phone_numbers: { $in: phone_numbers } }).session(session);
            if (phoneNumberInUse) {
                await session.abortTransaction();
                return res.status(400).json({ error: true, message: "A user with that phone number exists" });
            }

            const { error } = registerValidationSchema.validate({ ...registerInfo, phone_numbers });
            if (error) {
                await session.abortTransaction();
                return res.status(422).json({ error: true, message: error.details[0].message });
            }

            const emailTaken = await User.exists({ email }).session(session);
            if (emailTaken) {
                await session.abortTransaction();
                return res.status(422).json({ error: true, message: "Email taken!" });
            }

            let referrer = null;
            if (referral_code) {
                referrer = await User.findOne({ referral_code }).session(session);
                if (!referrer) {
                    await session.abortTransaction();
                    return res.status(404).json({ error: true, message: "Invalid referral code!" });
                }
            }
            const user = new User(registerInfo);
            if (!user) {
                await session.abortTransaction();
                return res.status(400).json({ error: true, message: "Error registering user" });
            }

            // Add user phone numbers
            user.phone_numbers = phone_numbers;

            const referralCode = await AuthService.generateUniqueReferralCode();
            if (!referralCode) {
                await session.abortTransaction();
                return res.status(500).json({ error: true, message: "Error creating referral code" });
            }
            user.referral_code = referralCode;

            // Add wallet 
            const wallet = new Wallet();
            await wallet.save({ session });

            user.wallet = wallet._id as Types.ObjectId;

            // Check if there is a valid referrer and add new user to list of referrals if true
            if (referrer) {
                referrer.referrals.push(user._id);
                user.referred_by = referrer._id;
                await referrer.save({ session });
            }

            await user.save({ session });

            const emailVToken = new OTP({ kind: "verification", owner: user._id, token: generateOTP() });
            if (!emailVToken) {
                await session.abortTransaction();
                return res.status(400).json({ error: true, message: "Error sending verification mail" });
            }
            await emailVToken.save({ session });

            const full_name = `${first_name} ${last_name}`;
            await EmailService.sendMail(email, full_name, 'verification', emailVToken.token!);

            const onboardingToken = await AuthService.createToken(user._id, cfg.ONBOARDING_TOKEN_SECRET, "7d");

    
            // when all the register operations have successfully completed commit the transactions to the db
            await session.commitTransaction();
            res.setHeader("x-onboarding-user", onboardingToken);

            const { createdAt, updatedAt, ...userInfo } = user;

            return res.status(201).json({
                success: true,
                message: "User created successfully!",
                onboarding_token: onboardingToken
            });

        } catch (error) {
            console.error(error);
            await session.abortTransaction();
            return res.status(500).json({ error: true, message: "Error registering user" });
        } finally {
            await session.endSession();
        }
    }

    // Resend verification email
    static async resendVerificationMail(req: Request, res: Response) {
        try {
            let { email }: { email: string } = req.body;
            email = email.toLowerCase();
            const user = await User.findOne({ email });
            if (!user) return res.status(404).json({ error: true, message: "Email not found!" });

            // Find and delete previous otp
            await OTP.findOneAndDelete({ kind: "verification", owner: user._id });

            const emailVToken = new OTP({ kind: "verification", owner: user._id, token: generateOTP() });
            if (!emailVToken) {
                return res.status(400).json({ error: true, message: "Error sending verification mail" });
            }
            const full_name = `${user.first_name} ${user.last_name}`;
            await EmailService.sendMail(email, full_name, 'verification', emailVToken.token);

            const onboardingToken = await AuthService.createToken(user._id, cfg.ONBOARDING_TOKEN_SECRET, "7d");

            res.setHeader("x-onboarding-user", onboardingToken);

            await emailVToken.save();
            await user.save();

            return res.status(200).json({
                success: true,
                onboarding_token: onboardingToken,
                message: "Verification email sent successfully",
            });
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

            if (!unverifiedUserToken) {
                return res.status(422).json({ error: true, message: "x-onboarding-user header is not set" })
            }

            const decodedToken = jwt.verify(unverifiedUserToken, cfg.ONBOARDING_TOKEN_SECRET) as any as JwtPayload;
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
            const { password }: { password: string } = req.body;
            const userToken = req.headers?.["x-onboarding-user"] as string;
            if (!userToken) {
                return res.status(422).json({ error: true, message: "x-onboarding-user header is not set" })
            }

            // Sanitize pwd (ensure it doesnt contain whitespace and it is properly formatted)
            const { error } = PasswordValidationSchema.validate(password);
            if (error) {
                return res.status(422).json({ error: true, message: error.details[0].message });
            }

            const decodedToken = jwt.verify(userToken, cfg.ONBOARDING_TOKEN_SECRET) as JwtPayload;
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
            const isBvnDigit = /^\d+$/.test(bvn);
            if (bvn.length !== 11 || !isBvnDigit) {
                return res.status(422).json({ error: true, message: "Invalid bvn" });
            }

            // Verify onboarding token and check if user is valid
            const unverifiedUserToken = req.headers["x-onboarding-user"] as string;
            if (!unverifiedUserToken) {
                return res.status(422).json({ error: true, message: "x-onboarding-user header is not set" })
            }

            const decodedToken = jwt.verify(unverifiedUserToken, cfg.ONBOARDING_TOKEN_SECRET) as any as JwtPayload;
            if (!decodedToken) return res.status(403).json({ error: true, message: "Error authenticating user!" });

            const user = await User.findById(decodedToken.id);
            const bvnInUse = await User.findOne({ "bvn.hash": hashBvn(bvn) });

            // Check that bvn recors do not exist in db
            if (!user) return res.status(404).json({ error: true, message: "User not found!" });
            if (bvnInUse) return res.status(400).json({ error: true, message: "BVN is already in use" })

            const bvnValidationRes = await FincraService.resolveBvn(bvn, cfg.FINCRA_BUSINESS_ID);

            if (!bvnValidationRes || bvnValidationRes.success !== true) {
                return res.status(400).json({ error: true, message: "Error validating bvn" });
            }
            const firstName = bvnValidationRes.data.response.firstName.toLowerCase();
            const lastName = bvnValidationRes.data.response.lastName.toLowerCase();
            if (user.first_name.toLowerCase() !== firstName || lastName !== user.last_name.toLowerCase()) {
                // return res.status(400).json({ error: true, message: "Bvn data mismatch" });
            }

            const encryptedData = encryptBvn(bvn);
            const bvnHash = hashBvn(bvn);

            user.bvn = {
                verification_status: "verified",
                verified_at: new Date(),
                encrypted_data: encryptedData,
                hash: bvnHash,
            };
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
            return res.status(200).json({ success: true, banks: matchedBanks });
        }
        return res.status(200).json({ success: true, banks: BankCodes });
    }

    // bank account details
    static async validateBankDetails(req: Request, res: Response) {
        const session = await startSession();
        try {
            const { account_no, bank_code } = req.body;

            if (!account_no || !bank_code) {
                return res.status(422).json({
                    error: true,
                    message: `${account_no ? "Bank code" : "Account no"} is required`
                });
            }

            // Verify onboarding token and check if user is valid
            const unverifiedUserToken = req.headers["x-onboarding-user"] as string;
            if (!unverifiedUserToken) {
                return res.status(422).json({ error: true, message: "x-onboarding-user header is not set" })
            }

            const decodedToken = jwt.verify(unverifiedUserToken, cfg.ONBOARDING_TOKEN_SECRET) as any as JwtPayload;
            if (!decodedToken) return res.status(403).json({ error: true, message: "Error authenticating user!" });

            // Intiate db transaction
            session.startTransaction();

            const user = await User.findById(decodedToken.id).session(session);
            if (!user) {
                await session.abortTransaction();
                return res.status(404).json({ error: true, message: "User not found!" });
            }


            // Validate bank account with paystack
            const validBankAcc = await PaystackService.validateAccountDetails(account_no, bank_code)
            if (!validBankAcc) {
                await session.abortTransaction();
                return res.status(400).json({ error: true, message: "Invalid bank details " })
            }
            const accNameMatched = matchAccNameInDb(
                user.first_name,
                user.last_name,
                user.middle_name ?? null,
                (validBankAcc as any).account_name
            );
            if (!accNameMatched) {
                await session.abortTransaction();
                return res.status(400).json({ error: true, message: "Bank account and db user details mismatch!" });
            }

            user.bank_details = { account_no, bank_code, added_at: new Date() };

            await user.save({ session });

            // Commit  transactions to the db
            await session.commitTransaction();
            return res.status(200).json({
                success: true,
                message: "Bank details added successfully",
                account: validBankAcc
            });

        } catch (error) {
            await session.abortTransaction();
            console.error(error);
            if (error.code === 11000) {
                return res.status(422).json({ error: true, message: "A user exists with that account already" })
            }

            return res.status(500).json({ error: true, message: "Error adding bank account details" })
        } finally {
            await session.endSession();
        }
    }

    // Forgot password
    static async generatePasswordResetToken(req: Request, res: Response) {
        const session = await startSession();
        try {
            session.startTransaction();

            const { email } = req.body;
            if (!email || !email.trim()) {
                return res.status(422).json({ error: true, message: "Email required!" });
            }
            const user = await User.findOne({ email: email.toLowerCase() }).session(session);
            if (!user) {
                await session.abortTransaction();
                return res.status(404).json({ error: true, message: "Email not found" });
            }

            // Delete any previous reset tokens
            await OTP.findOneAndDelete({ kind: "password_reset", owner: user._id }, { session });
            const resetPasswordOTP = new OTP({ kind: "password_reset", owner: user._id, token: generateOTP() });

            const full_name = `${user.first_name} ${user.last_name}`
            await EmailService.sendMail(email, full_name, 'pwd_reset', resetPasswordOTP.token);

            await resetPasswordOTP.save({ session });

            await session.commitTransaction();

            return res.status(200).json({
                success: true,
                message: "A password reset token has been sent to your email"
            });
        } catch (error) {
            await session.abortTransaction();
            console.error(error);
            return res.status(500).json({
                error: true,
                message: "An error occured while trying to reset password"
            });
        } finally {
            await session.endSession();
        }

    }

    // Verify reset password OTP
    static async verifyResetPwdOTP(req: Request, res: Response) {
        try {
            const { otp, email } = req.body;

            if (!otp || !email || !email.trim()) {
                return res.status(422).json({ error: true, message: "Email and otp token required!" });
            }

            const user = await User.findOne({ email: email.toLowerCase() });
            if (!user) return res.status(422).json({ error: true, message: "Error verifying otp!" });

            const otpInDb = await OTP.findOneAndDelete({ owner: user._id, token: otp });
            if (!otpInDb) return res.status(400).json({ error: true, message: "OTP verification failed!" });

            const otpExpired = otpInDb.expires.valueOf() < Date.now();
            if (otpExpired) {
                return res.status(400).json({ error: true, message: "OTP expired!" });
            }

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

            // Sanitize pwd (ensure it doesnt contain whitespace and it is properly formatted)
            const { error } = PasswordValidationSchema.validate(password);
            if (error) {
                return res.status(422).json({ error: true, message: error.details[0].message });
            }

            const authToken = req.headers.authorization?.toString().split(" ")[1];
            if (!authToken) return res.status(401).json({ error: true, message: "Error authenticating user" });

            const decoded = jwt.verify(authToken, cfg.ACCESS_TOKEN_SECRET) as any as JwtPayload;
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
            if (!email.trim() || !password.trim()) {
                return res.status(422).json({ error: true, message: `${email ? "password" : "email"} required for sign in` });
            }

            const user = await User.findOne({ email });
            if (!user) return res.status(404).json({ error: true, message: "Incorrect username or password!" });

            const passwordsMatch = await bcrypt.compare(password, user.password as string);
            if (!passwordsMatch) return res.status(403).json({ error: true, message: "Invalid username or password!" });

            if (user.bvn?.verification_status !== "verified" || !user.bank_details || !user.email_verified) {
                return res.status(400).json({ error: true, message: "Cannot skip onboarding process" });
            }
            const authToken = await AuthService.createToken(user._id, cfg.ACCESS_TOKEN_SECRET, "2h");
            const refreshToken = await AuthService.createToken(user._id, cfg.REFRESH_TOKEN_SECRET, "30d");

            return res.status(200).json({
                success: true,
                message: "Login successful",
                access_token: authToken,
                refresh_token: refreshToken,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error signing in user" });
        }
    }

    // Refresh access token
    static async refresh(req: Request, res: Response) {
        try {
            const refreshHeader = req.headers["x-refresh"] as string;
            const [_, refreshToken] = refreshHeader.split(" ");
            if (!refreshHeader || !refreshToken) {
                return res.status(401).json({ error: true, message: "Unauthorized" });
            }

            // Validate refresh token
            const decoded = jwt.verify(refreshToken, cfg.REFRESH_TOKEN_SECRET) as JwtPayload;
            if (!decoded) return res.status(403).json({ error: true, message: "Refresh token expired" });

            const user = await User.exists({ _id: decoded.id });
            if (!user) return res.status(404).json({ error: true, message: "User not found!" });

            //Create new access token
            const accessToken = await AuthService.createToken(user._id, cfg.ACCESS_TOKEN_SECRET, "2h")
            res.setHeader("Authorization", `Bearer ${accessToken}`);

            return res.status(200).json({
                success: true,
                message: "Access refreshed",
                access_token: accessToken
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Internal server error" });
        }
    }
}

export default AuthController;
