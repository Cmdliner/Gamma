import type { Request, Response } from "express";
import User from "../models/user.model";
import IWallet from "../types/wallet.schema";
import PaystackService from "../services/paystack.service";
import { ProcessCloudinaryImage } from "../middlewares/upload.middlewares";
import { ReferralTransaction, WithdrawalTransaction } from "../models/transaction.model";
import { AppUtils } from "../lib/utils";
import type IUser from "../types/user.schema";
import Expo from "expo-server-sdk";
import { AppError } from "../lib/error.handler";
import { StatusCodes } from "http-status-codes";
import { logger } from "../config/logger.config";
import type { IAbuse } from "../types/abuse.schema";
import AbuseComplaint from "../models/abuse.model";
import Wallet from "../models/wallet.model";
import { UserUpdateValidationSchema } from "../validations/user.validation";
import { PaymentService } from "../services/payment.service";

class UserController {
    static async getUserInfo(req: Request, res: Response) {
        try {
            const user = await User.findById(req.user?._id).select([
                "-password",
                "-identity",
                "-device_push_token"
            ]);
            if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found!");

            return res.status(StatusCodes.OK).json({ success: true, user });
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Couldn't fetch user details");
            return res.status(status).json(errResponse);
        }
    }

    static async getWalletBalance(req: Request, res: Response) {
        try {
            const user = await User.findById(req.user?._id).populate("wallet");
            if (!user) throw new AppError(StatusCodes.NOT_FOUND, "Could not get wallet balance");

            const userWalletObj = (user.wallet as unknown as IWallet);
            const totalWalletBalance = await PaymentService.getWalletBalance(userWalletObj);
            const availableBalance = totalWalletBalance - userWalletObj.rewards_balance;
            
            return res.status(StatusCodes.OK).json({ success: true, balance: availableBalance });
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error getting wallet balance")
            return res.status(status).json(errResponse);
        }
    }

    static async getReferralInfo(req: Request, res: Response) {
        try {
            const user = await User.findById(req.user?._id).populate("referrals");
            if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found!");

            const userWallet = await Wallet.findById(user.wallet);
            if (!userWallet) throw new AppError(StatusCodes.NOT_FOUND, "Wallet not found!");

            const referral_code = user.referral_code;
            const total_referrals = user.referrals.length;
            const active_referrals = (user.referrals as unknown as IUser[])
                .filter((referral: IUser) => referral.account_status === "active").length;
            const rewards_balance = userWallet.rewards_balance;
            let amount_withdrawn = 0;

            // Get referral history
            const referral_history = await ReferralTransaction.find({ bearer: user._id }).sort({ createdAt: -1 });

            // Calculate the total amount withdrawn
            const rewardsWithdrawals = await WithdrawalTransaction.find({ bearer: user._id, from: "rewards" });
            if (rewardsWithdrawals.length) {
                rewardsWithdrawals.forEach(withdrawal => amount_withdrawn += withdrawal.amount);
            }

            return res.status(200).json({
                success: true,
                info: { referral_code, total_referrals, amount_withdrawn, active_referrals, rewards_balance, referral_history }
            })
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error retrieving referral info");
            return res.status(status).json(errResponse);
        }
    }

    static async editBankAccountDetails(req: Request, res: Response) {
        try {
            const { account_no, bank_code } = req.body;

            const bankDetails = req.user?.bank_details;
            console.log({ bank_details: bankDetails });
            if (!bankDetails) throw new AppError(StatusCodes.BAD_REQUEST, "Cannot update bank details");


            const dateAdded = bankDetails?.added_at.valueOf();
            const threeMonthsFromDateAdded = dateAdded + (30 * 24 * 60 * 60 * 1000);

            // Check if 3 months has passed
            if (threeMonthsFromDateAdded > Date.now()) {
                throw new AppError(StatusCodes.BAD_REQUEST, "Cannot update bank account details at this moment");
            }

            // Verify bank account with paystack
            const isValidBankAccount = await PaystackService.validateAccountDetails(account_no, bank_code);
            if (!isValidBankAccount) throw new AppError(StatusCodes.BAD_REQUEST, "Invalid bank details");


            await User.findByIdAndUpdate(req.user?._id, { "bank_details.account_no": account_no }, { new: true });
            return res.status(StatusCodes.OK).json({ success: true, message: "Bank details updated successfully!" });

        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error updating bank account details");
            return res.status(status).json(errResponse);
        }
    }

    static async updateDisplayPicture(req: Request, res: Response) {
        try {
            const displayPic = req.file;
            const userId = req.user?._id;
            if (!displayPic || !displayPic.mimetype.startsWith("image/")) {
                throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, "Image file required!");
            }

            // Upload to cloudinary
            const uploadPath = await ProcessCloudinaryImage(displayPic);

            const user = await User.findById(userId);
            if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found!");

            user.display_pic = uploadPath;
            await user.save();

            return res.status(StatusCodes.OK).json({ success: true, message: "Upload successful" });
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error updating profile picture!");
            return res.status(status).json(errResponse);
        }
    }

    static async updateInfo(req: Request, res: Response) {
        try {
            const { phone_no_1, phone_no_2 } = req.body;
            const verificationDocuments = req.verification_docs;
            const profilePic = req.profile_pic;

            const location = AppUtils.resolveLocation(req.body.location);

            const phone_nos: any = [];
            if (phone_no_1) phone_nos.push(phone_no_1);
            if (phone_no_2) phone_nos.push(phone_no_2);


            const { error } = UserUpdateValidationSchema.validate({ location, phone_nos });
            if (error) throw new AppError(StatusCodes.BAD_REQUEST, error.details[0].message);

            const user = await User.findById(req.user?._id);
            if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found!");

            if (phone_nos[0]) user.phone_numbers[0] = phone_no_1;
            if (phone_nos[1]) user.phone_numbers[1] = phone_no_2;

            if (req.body.location) user.location = location;

            let phoneNumberInUse = false;
            if (phone_no_1 || phone_no_2) {
                phoneNumberInUse = !!await User.exists({
                    _id: { $not: req.user._id },
                    phone_numbers: { $in: phone_nos }
                });
            }
            if (phoneNumberInUse) throw new AppError(StatusCodes.BAD_REQUEST, "Phone number in use!");

            if (profilePic) user.display_pic = profilePic;
            if (verificationDocuments) user.verification_docs = verificationDocuments;

            await user.save();
            return res.status(StatusCodes.OK).json({ success: true, message: "User details updated" });
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error occured while updating user info");
            return res.status(status).json(errResponse);
        }

    }

    static async updateUsersDevicePushToken(req: Request, res: Response) {
        const { device_push_token } = req.body;
        try {
            const user = await User.findById(req.user?._id);
            if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found!");

            if (!Expo.isExpoPushToken(device_push_token)) {
                throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, "Invalid push token!");
            }
            user.device_push_token = device_push_token;
            await user.save();

            return res.status(StatusCodes.OK).json({ success: true, message: "Push token updated!" });

        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error updating the push token")
            return res.status(status).json(errResponse);
        }
    }

    static async reportAbuse(req: Request, res: Response) {
        try {
            const { subject, body } = req.body;
            const { screenshots } = req.files as any;

            const processedScreenshots = null;
            if (screenshots) {
                await Promise.all(screenshots.map(ProcessCloudinaryImage));
            }
            if (!processedScreenshots) {
                throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, "Screenshots required!");
            }
            if (!subject || !body) {
                throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, "`subject` and `body` required");
            }
            const abuseComplaintData: IAbuse = { subject, body };
            if (processedScreenshots) abuseComplaintData.screenshots = processedScreenshots;
            const abuseComplaint = new AbuseComplaint(abuseComplaintData);
            await abuseComplaint.save();

            return res.status(StatusCodes.CREATED).json({ success: true, message: "Your report has been sent" });

        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Can't make a report at the moment");
            return res.status(status).json(errResponse);
        }
    }

}

export default UserController;