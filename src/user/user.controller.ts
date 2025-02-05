import type { Request, Response } from "express";
import User from "./user.model";
import IWallet from "../types/wallet.schema";
import PaystackService from "../lib/paystack.service";
import { ProcessCloudinaryImage } from "../middlewares/upload.middlewares";
import { ReferralTransaction, WithdrawalTransaction } from "../payment/transaction.model";
import { resolveLocation } from "../lib/utils";
import IUser from "../types/user.schema";
import Expo from "expo-server-sdk";
import { AppError } from "../lib/error.handler";
import { StatusCodes } from "http-status-codes";
import { logger } from "../config/logger.config";

class UserController {
    static async getUserInfo(req: Request, res: Response) {
        try {
            const user = await User.findById(req.user?._id).select([
                "-password",
                "-bvn",
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
            if (!user) throw new AppError(StatusCodes.OK, "Could not get wallet balance");

            const balance = (user.wallet as unknown as IWallet).balance;
            return res.status(StatusCodes.OK).json({ success: true, balance });

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

            const referral_code = user.referral_code;
            const total_referrals = user.referrals.length;
            const active_referrals = (user.referrals as unknown as IUser[])
                .filter((referral: IUser) => referral.account_status === "active").length;
            const rewards_balance = user.rewards.balance;
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
                return res.status(422).json({ error: true, message: "Image file required!" });
            }

            // Upload to cloudinary
            const uploadPath = await ProcessCloudinaryImage(displayPic);

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: true, message: "User not found!" });
            }

            user.display_pic = uploadPath;
            await user.save();

            return res.status(200).json({ success: true, message: "Display picture upload successful" });
        } catch (error) {
            logger.error(error);
            return res.status(500).json({ error: true, message: "Error updating display picture" })
        }
    }

    static async updateInfo(req: Request, res: Response) {
        const { phone_no_1, phone_no_2 } = req.body;
        const verificationDocuments = req.verification_docs;
        const profilePic = req.profile_pic;
        try {
            const user = await User.findById(req.user?._id);
            if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found!");

            if (req.body.location) {
                user.location = resolveLocation(req.body.location);
            }

            // !todo => Validate phone no schema
            const inputedPhoneNos: any = [];
            if (phone_no_1) {
                inputedPhoneNos.push(phone_no_1);
                user.phone_numbers[0] = phone_no_1;
            }
            if (phone_no_2) {
                inputedPhoneNos.push(phone_no_2);
                user.phone_numbers[1] = phone_no_2;
            }

            let phoneNumberInUse = false;
            if (phone_no_1 || phone_no_2) {
                phoneNumberInUse = !!await User.exists({ phone_numbers: { $in: inputedPhoneNos } });
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

            // Ensure that the device push token matches expo push token fmt
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

}

export default UserController;