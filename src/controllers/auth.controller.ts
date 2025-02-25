import type { Request, Response } from "express";
import type { IRegisterUser } from "../types/user.dto";
import { PasswordValidationSchema, registerValidationSchema } from "../validations/auth.validation";
import { startSession, Types } from "mongoose";
import jwt, { type JwtPayload } from "jsonwebtoken";
import EmailService from "../services/email.service";
import User from "../models/user.model";
import OTP from "../models/otp.model";
import * as bcrypt from "bcryptjs";
import AuthService from "../services/auth.service";
import Wallet from "../models/wallet.model";
import { generateOTP, hashIdentityNumber, matchAccNameInDb, querySafeHavenBankCodes } from "../lib/utils";
import PaystackService from "../services/paystack.service";
import { BankCodes, IBankInfo } from "../lib/bank_codes";
import FincraService from "../services/fincra.service";
import { cfg } from "../init";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../lib/error.handler";
import { logger } from "../config/logger.config";
import { PaymentService } from "../services/payment.service";


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
                email: email?.trim().toLowerCase(),
                gender,
                state_of_origin,
                interested_categories,
            };

            // Add error that checks that at least we have a phone number 1 field
            if (!phone_no_1) {
                throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, "At least one phone number is required");
            }

            // Add middle name and location if present
            if (middle_name) registerInfo.middle_name = middle_name;

            // Verify and add location if valid
            const location = await AuthService.resolveLocation(req.body.location)
            registerInfo.location = location;

            const phone_numbers = [phone_no_1];
            if (phone_no_2) phone_numbers.push(phone_no_2);

            // Verify that no user has any of the phone numbers before
            const phoneNumberInUse = await User.findOne({ phone_numbers: { $in: phone_numbers } }).session(session);
            if (phoneNumberInUse) {
                throw new AppError(StatusCodes.BAD_REQUEST, "A user with that phone number exists");
            }

            const { error } = registerValidationSchema.validate({ ...registerInfo, phone_numbers });
            if (error) {
                throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, error.details[0].message);
            }

            const emailTaken = await User.exists({ email }).session(session);
            if (emailTaken) throw new AppError(StatusCodes.BAD_REQUEST, "Email taken!");

            let referrer = null;
            if (referral_code) {
                referrer = await User.findOne({ referral_code }).session(session);
                if (!referrer) {
                    throw new AppError(StatusCodes.NOT_FOUND, "Invalid referral code!");
                }
            }
            const user = new User(registerInfo);
            if (!user) throw new AppError(StatusCodes.BAD_REQUEST, "Error registering user");

            // Generate referral code
            const referralCode = await AuthService.generateUniqueReferralCode();
            if (!referralCode) throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Error generating referral code");

            // Add wallet 
            const wallet = new Wallet();
            await wallet.save({ session });

            // Add user phone numbers, referral code and wallet_id
            user.phone_numbers = phone_numbers;
            user.referral_code = referralCode;
            user.wallet = wallet._id as Types.ObjectId;

            // Check if there is a valid referrer and add new user to list of referrals if true
            if (referrer) {
                referrer.referrals.push(user._id);
                user.referred_by = referrer._id;
                await referrer.save({ session });
            }

            await user.save({ session });

            const emailVToken = new OTP({
                kind: "verification",
                owner: user._id,
                token: generateOTP(),
                expires: new Date(Date.now() + 10 * 60 * 1000), // Expires in the next 10 mins
            });
            if (!emailVToken) throw new AppError(StatusCodes.BAD_REQUEST, "Error sending verification mail");

            await emailVToken.save({ session });

            const full_name = `${first_name} ${last_name}`;
            await EmailService.sendMail(email, full_name, 'verification', emailVToken.token!);

            const onboardingToken = await AuthService.createToken(user._id, cfg.ONBOARDING_TOKEN_SECRET, "7d");

            await session.commitTransaction();

            return res.status(StatusCodes.CREATED).json({
                success: true,
                message: "User created successfully!",
                onboarding_token: onboardingToken
            });

        } catch (error) {
            logger.error(error);
            await session.abortTransaction();

            const [status, errResponse] = AppError.handle(error, "Error registering user");
            return res.status(status).json(errResponse);
        } finally {
            await session.endSession();
        }
    }

    // Resend verification email
    static async resendVerificationMail(req: Request, res: Response) {

        const session = await startSession();

        try {
            session.startTransaction();
            let { email }: { email: string } = req.body;
            email = email.toLowerCase();

            const user = await User.findOne({ email }).session(session);
            if (!user) throw new AppError(StatusCodes.NOT_FOUND, "Email not found");

            // Find and delete previous otp
            await OTP.findOneAndDelete({ kind: "verification", owner: user._id }).session(session);

            const emailVToken = new OTP({
                kind: "verification",
                owner: user._id,
                token: generateOTP(),
                expires: new Date(Date.now() + 10 * 60 * 1000) // Expires in the next 10 mins
            });
            if (!emailVToken) {
                throw new AppError(StatusCodes.BAD_REQUEST, "Error sending verification mail");
            }

            const fullName = `${user.first_name} ${user.last_name}`;
            await EmailService.sendMail(email, fullName, 'verification', emailVToken.token);

            const onboardingToken = await AuthService.createToken(user._id, cfg.ONBOARDING_TOKEN_SECRET, "7d");

            await emailVToken.save({ session });
            await user.save({ session });

            await session.commitTransaction();

            return res.status(StatusCodes.OK).json({
                success: true,
                onboarding_token: onboardingToken,
                message: "Verification email sent successfully",
            });
        } catch (error) {
            await session.abortTransaction();
            logger.error(error);

            const [status, errResponse] = AppError.handle(error, "Error sending verification email");
            return res.status(status).json(errResponse);
        } finally {
            await session.endSession();
        }
    }

    // Email verification
    static async verifyEmail(req: Request, res: Response) {
        try {
            const { otp } = req.body;
            if (!otp) throw new AppError(StatusCodes.FORBIDDEN, "OTP required!");
            const unverifiedUserToken = req.headers["x-onboarding-user"] as string;
            if (!unverifiedUserToken) {
                throw new AppError(StatusCodes.FORBIDDEN, "x-onboarding-user header required");
            }

            // Decode onboarding header
            const { error, id, reason, message } = AuthService.decodeOnboardingToken(unverifiedUserToken);
            if (error) {
                throw new AppError(StatusCodes.FORBIDDEN, message, reason);
            }

            const user = await User.findById(id);
            if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found!");

            const otpInDb = await OTP.findOne({ owner: user._id, token: otp });
            if (!otpInDb) throw new AppError(StatusCodes.NOT_FOUND, "OTP not found!");

            // ensure otp is not expired
            if (otpInDb.expires.valueOf() < new Date().valueOf()) {
                throw new AppError(StatusCodes.BAD_REQUEST, "OTP expired!");
            }

            const userVerificationOTP = await OTP.findOneAndDelete({ kind: "verification", owner: user._id, token: otp });
            if (!userVerificationOTP) throw new AppError(StatusCodes.BAD_REQUEST, "Invalid OTP!");
            if (user.email_verified) {
                return res.status(StatusCodes.OK).json({ success: true, message: "User verification successful" });
            }
            user.email_verified = true;
            await user.save();

            return res.status(StatusCodes.OK).json({ success: true, message: "User verification successful" });

        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error verifying email");
            return res.status(status).json(errResponse);
        }
    }

    // Set password
    static async setPassword(req: Request, res: Response) {
        try {
            const { password }: { password: string } = req.body;

            const unverifiedUserToken = req.headers["x-onboarding-user"] as string;
            if (!unverifiedUserToken) {
                throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, "x-onboarding-user header is not set");
            }

            // Decode onboarding header
            const { error, id, reason, message } = AuthService.decodeOnboardingToken(unverifiedUserToken);
            if (error) {
                throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, message, reason);
            }

            // Sanitize pwd (ensure it doesnt contain whitespace and it is properly formatted)
            let validationRes = PasswordValidationSchema.validate(password);
            if (validationRes.error) {
                throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, validationRes.error.details[0].message);
            }


            const user = await User.findById(id);
            if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found!");

            // Return early if user already has a password
            if (user.password) {
                throw new AppError(StatusCodes.BAD_REQUEST, "User password has been set previously!");
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            if (!hashedPassword) {
                throw new AppError(StatusCodes.BAD_REQUEST, "Error creating password");
            }
            user.password = hashedPassword;
            await user.save();

            return res.status(StatusCodes.OK).json({ success: true, message: "Password created successfully" });

        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error setting password");
            return res.status(status).json(errResponse);
        }

    }

    // kyc
    static async verifyIdentity(req: Request, res: Response) {
        try {
            const { bvn }: { bvn: string } = req.body;
            if (!bvn) {
                throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, "BVN required!");
            }

            // Sanitize the bvn make sure it is required no of digits and all numerical
            const isBvnDigit = /^\d+$/.test(bvn);
            if (bvn.length !== 11 || !isBvnDigit) {
                throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, "Invalid BVN!");
            }

            // Verify onboarding token and check if user is valid
            const unverifiedUserToken = req.headers["x-onboarding-user"] as string;
            if (!unverifiedUserToken) {
                throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, "x-onboarding-user header required!");
            }

            // Decode onboarding header
            const { error, id, reason, message } = AuthService.decodeOnboardingToken(unverifiedUserToken);
            if (error) {
                throw new AppError(StatusCodes.FORBIDDEN, message, reason);
            }

            const user = await User.findById(id);
            const bvnInUse = await User.findOne({
                "identity.identity_type": "bvn",
                "identity.hash": hashIdentityNumber(bvn),
            });

            // Check that bvn records do not exist in db
            if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found!");
            if (bvnInUse) throw new AppError(StatusCodes.BAD_REQUEST, "BVN is already in use");

            const bvnValidationRes = await FincraService.resolveBvn(bvn, cfg.FINCRA_BUSINESS_ID);

            if (!bvnValidationRes || bvnValidationRes.success !== true) {
                throw new AppError(StatusCodes.BAD_REQUEST, "Error validating BVN");
            }
            const firstName = bvnValidationRes.data.response.firstName.toLowerCase();
            const lastName = bvnValidationRes.data.response.lastName.toLowerCase();
            if (user.first_name.toLowerCase() !== firstName || lastName !== user.last_name.toLowerCase()) {
                // throw new AppError(StatusCodes.BAD_REQUEST, "BVN data mismatch!");
            }

            const { identity_validation_error, error_message, vId } = await PaymentService.verifyIdentity(bvn, "BVN");
            if (identity_validation_error) throw new AppError(StatusCodes.BAD_REQUEST, error_message);

            const identityHash = hashIdentityNumber(bvn);

            user.identity = {
                identity_type: "bvn",
                verification_status: "verified",
                verified_at: new Date(),
                v_id: vId,
                hash: identityHash,
            };
            await user.save();

            return res.status(StatusCodes.OK).json({ success: true, message: "Bvn verification successful" });
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "An error occured during bvn verification");
            return res.status(status).json(errResponse);
        }

    }

    static async getPaystackBankCodes(req: Request, res: Response) {
        try {
            const { q } = req.query;
            const searchPattern = new RegExp(`${q}`, "i");

            const matchedBanks = BankCodes.filter((bankCode: IBankInfo) => bankCode.name.match(searchPattern));
            if (matchedBanks) {
                return res.status(StatusCodes.OK).json({ success: true, banks: matchedBanks });
            }
            return res.status(StatusCodes.OK).json({ success: true, banks: BankCodes });
        } catch (error) {
            logger.error(error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: true, message: "Error retrieving bank codes" });
        }
    }



    // bank account details
    static async validateBankDetails(req: Request, res: Response) {
        const session = await startSession();
        try {
            session.startTransaction();
            const { account_no, bank_name, paystack_bank_code } = req.body;

            if(!bank_name) throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, `"bank_name" required`);
            if (!account_no || !paystack_bank_code) {
                throw new AppError(
                    StatusCodes.UNPROCESSABLE_ENTITY, 
                    `${account_no ? "paystack_bank_code" : "account_no"} required`
                );
            }

            const unverifiedUserToken = req.headers["x-onboarding-user"] as string;
            if (!unverifiedUserToken) {
                throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, "x-onboarding-user header is not set");
            }

            const { error, id, reason, message } = AuthService.decodeOnboardingToken(unverifiedUserToken);
            if (error) throw new AppError(StatusCodes.FORBIDDEN, message, reason);

            const bankCodeSearchQuery = new RegExp(bank_name, "i");

            const safehavenBankDetails = querySafeHavenBankCodes(bankCodeSearchQuery);
            if(!safehavenBankDetails) throw new AppError(StatusCodes.BAD_REQUEST, "Bank unrecognized");

            const user = await User.findById(id).session(session);
            if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found!");

            const validBankAcc = await PaystackService.validateAccountDetails(account_no, paystack_bank_code);
            
            if (!validBankAcc) throw new AppError(StatusCodes.BAD_REQUEST, "Invalid bank details");
            const accNameMatched = matchAccNameInDb(
                user.first_name,
                user.last_name,
                user.middle_name ?? null,
                (validBankAcc as any).account_name
            );
            if (!accNameMatched) {
                throw new AppError(StatusCodes.BAD_REQUEST, "Bank account and db user details mismatch!");
            }
  
            user.bank_details = { 
                account_no: account_no.toString(), 
                bank_code: safehavenBankDetails.bank_code, 
                added_at: new Date() 
            };
            await user.save({ session });

            const { wallet_creation_error, err_message, wallet_account } = await PaymentService.createUserWallet(user);
            if (wallet_creation_error) throw new AppError(StatusCodes.BAD_REQUEST, err_message);

            const wallet = await Wallet.findById(user.wallet);
            if (!wallet) throw new AppError(StatusCodes.NOT_FOUND, "Wallet not found!");

            wallet.account = {
                provider: 'safe_haven',
                account_no: wallet_account
            };
            await wallet.save({ session });

            const authToken = await AuthService.createToken(user._id, cfg.ACCESS_TOKEN_SECRET, '2h');

            await session.commitTransaction();
            return res.status(StatusCodes.OK).json({
                success: true,
                message: "Bank details added successfully",
                account: validBankAcc,
                access_token: authToken
            });

        } catch (error) {
            await session.abortTransaction();
            logger.error(error);

            if (error.code === 11000) {
                return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ error: true, message: "A user exists with that account already" })
            }

            const [status, errResponse] = AppError.handle(error, "Error adding bank account details");
            return res.status(status).json(errResponse)
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
            if (!email?.trim()) {
                throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, "Email required!");
            }
            const user = await User.findOne({ email: email.toLowerCase() }).session(session);
            if (!user) throw new AppError(StatusCodes.NOT_FOUND, "Email not found");

            // Delete any previous reset tokens
            await OTP.findOneAndDelete({ kind: "password_reset", owner: user._id }, { session });
            const resetPasswordOTP = new OTP({ kind: "password_reset", owner: user._id, token: generateOTP() });

            const full_name = `${user.first_name} ${user.last_name}`
            await EmailService.sendMail(email, full_name, 'pwd_reset', resetPasswordOTP.token);

            await resetPasswordOTP.save({ session });

            await session.commitTransaction();

            return res.status(StatusCodes.OK).json({
                success: true,
                message: "A password reset token has been sent to your email"
            });
        } catch (error) {
            await session.abortTransaction();

            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "An error occured while trying to reset password");
            return res.status(status).json(errResponse);
        } finally {
            await session.endSession();
        }

    }

    // Verify reset password OTP
    static async verifyResetPwdOTP(req: Request, res: Response) {
        try {
            const { otp, email } = req.body;

            if (!otp || !email?.trim()) {
                throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, "Email and otp token required!")
            }

            const user = await User.findOne({ email: email.toLowerCase() });
            if (!user) throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, "Error verifying otp!")

            const otpInDb = await OTP.findOneAndDelete({ owner: user._id, token: otp });
            if (!otpInDb) throw new AppError(StatusCodes.BAD_REQUEST, "OTP verification failed!");

            const otpExpired = otpInDb.expires.valueOf() < Date.now();
            if (otpExpired) {
                throw new AppError(StatusCodes.BAD_REQUEST, "OTP expired!");
            }

            const authToken = await AuthService.createToken(user._id, cfg.ACCESS_TOKEN_SECRET, "2h");

            return res.status(StatusCodes.OK).json({
                success: true,
                message: "OTP verification successful!",
                access_token: authToken,
            });


        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error verifying OTP!");
            return res.status(status).json(errResponse);
        }
    }

    // Reset password
    static async resetPassword(req: Request, res: Response) {
        try {

            const { password } = req.body;

            if (!password) {
                throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, "Password required!");
            }

            // Sanitize pwd (ensure it doesnt contain whitespace and it is properly formatted)
            const { error } = PasswordValidationSchema.validate(password);
            if (error) {
                throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, error.details[0].message);
            }
            const user = await User.findById(req.user?.id);
            if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
            await user.save();

            return res.status(StatusCodes.OK).json({ success: true, message: "Password reset successful" });
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error reseting password");
            return res.status(status).json(errResponse);
        }

    }

    // Sign in
    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            if (!email?.trim() || !password?.trim()) {
                throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, `${email ? "password" : "email"} required for sign in`);
            }

            const user = await User.findOne({ email });
            if (!user) throw new AppError(StatusCodes.NOT_FOUND, "Incorrect username or password!");

            const passwordsMatch = await bcrypt.compare(password, user.password as string);
            if (!passwordsMatch) throw new AppError(StatusCodes.FORBIDDEN, "Invalid username or password!");

            if (user.identity?.verification_status !== "verified" || !user.bank_details || !user.email_verified) {
                throw new AppError(StatusCodes.BAD_REQUEST, "Cannot skip onboarding process");
            }
            const authToken = await AuthService.createToken(user._id, cfg.ACCESS_TOKEN_SECRET, "2h");
            const refreshToken = await AuthService.createToken(user._id, cfg.REFRESH_TOKEN_SECRET, "30d");

            return res.status(StatusCodes.OK).json({
                success: true,
                message: "Login successful",
                access_token: authToken,
                refresh_token: refreshToken,
            });
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error signing in user");
            return res.status(status).json(errResponse);
        }
    }

    // Refresh access token
    static async refresh(req: Request, res: Response) {
        try {
            const refreshHeader = req.headers["x-refresh"] as string;
            const [_, refreshToken] = refreshHeader.split(" ");
            if (!refreshHeader || !refreshToken) {
                throw new AppError(StatusCodes.UNAUTHORIZED, "Refresh token required");
            }

            // Validate refresh token
            const decoded = jwt.verify(refreshToken, cfg.REFRESH_TOKEN_SECRET) as JwtPayload;
            if (!decoded) throw new AppError(StatusCodes.FORBIDDEN, "Refresh token expired", "REFRESH_TOKEN_EXPIRED");

            const user = await User.exists({ _id: decoded.id });
            if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found!");

            // Create new access token
            const accessToken = await AuthService.createToken(user._id, cfg.ACCESS_TOKEN_SECRET, "2h")

            return res.status(StatusCodes.OK).json({
                success: true,
                message: "Access refreshed",
                access_token: accessToken
            });
        } catch (error) {
            logger.error(error);
            if ((error as Error).name === 'TokenExpiredError') {
                return res.status(StatusCodes.FORBIDDEN).json({ error: true, reason: "REFRESH_TOKEN_EXPIRED" })
            }
            const [status, errResponse] = AppError.handle(error, "Internal server error");
            return res.status(status).json(errResponse);
        }
    }
}

export default AuthController;
