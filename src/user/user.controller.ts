import type { Request, Response } from "express";
import User from "./user.model";
import IWallet from "../types/wallet.schema";
import PaystackService from "../lib/paystack.service";
import { ProcessCloudinaryImage } from "../middlewares/upload.middlewares";
import { ReferralTransaction } from "../payment/transaction.model";
import { isValidState } from "../lib/main";
import { GeospatialDataNigeria } from "../lib/location.data";
import IUser from "../types/user.schema";

class UserController {
    static async getUserInfo(req: Request, res: Response) {
        try {
            const user = await User.findById(req.user?._id!).select([
                "-password",
                "-bvn",
                "-device_push_token"
            ]);
            if (!user) return res.status(404).json({ error: true, message: "User not found!" });

            return res.status(200).json({ success: true, user });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Couldn't fetch user details" });
        }
    }

    static async getWalletBalance(req: Request, res: Response) {
        try {
            const user = await User.findById(req.user?._id).populate("wallet");
            if (!user) {
                return res.status(404).json({ error: true, message: "Could not get wallet balance" });
            }

            const balance = (user.wallet as unknown as IWallet).balance;
            return res.status(200).json({ success: true, balance });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error getting wallet balance" });
        }
    }

    static async getReferralInfo(req: Request, res: Response) {
        try {
            const user = await User.findById(req.user?._id).populate("referrals");
            // const user = req.user;
            if (!user) {
                return res.status(404).json({ error: true, message: "User not found!" });
            }
            const referral_code = user.referral_code;
            const total_referrals = user.referrals.length;
            const active_referrals = (user.referrals as unknown as IUser[])
                .filter((referral: IUser) => referral.account_status === "active").length;
            const rewards_balance = user.rewards.balance;

            return res.status(200).json({
                success: true,
                info: { referral_code, total_referrals, active_referrals, rewards_balance }
            })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error retrieving referral info" })
        }
    }

    static async editBankAccountDetails(req: Request, res: Response) {
        try {
            const { account_no, bank_code } = req.body;

            const bankDetails = req.user?.bank_details;
            console.log({ bank_details: bankDetails });
            if (!bankDetails) {
                return res.status(400).json({ error: true, message: "Cannot update bank details" });
            }

            const dateAdded = bankDetails?.added_at.valueOf();
            const threeMonthsFromDateAdded = dateAdded + (30 * 24 * 60 * 60 * 1000);

            // Check if 3 months has passed
            if (threeMonthsFromDateAdded > Date.now()) {
                return res.status(400).json({
                    error: true,
                    message: "Cannot update bank account details at this moment"
                });
            }

            // Verify bank account with paystack
            const isValidBankAccount = await PaystackService.validateAccountDetails(account_no, bank_code);
            if (!isValidBankAccount) {
                return res.status(400).json({ error: true, message: "Invalid bank details" });
            }

            await User.findByIdAndUpdate(req.user?._id!, { "bank_details.account_no": account_no }, { new: true });
            return res.status(200).json({ success: true, message: "Bank details updated successfully!" });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error updating bank account details" });
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
            console.error(error);
            return res.status(500).json({ error: true, message: "Error updating display picture" })
        }
    }

    static async updateInfo(req: Request, res: Response) {
        const { phone_no_1, phone_no_2 } = req.body;
        // !TODO => VALIDATE INPUTS AND HANDLE VERIFICATION DOCS UPLOAD
        try {
            const user = await User.findById(req.user?._id!);
            if (!user) return res.status(404).json({ error: true, message: "User not found!" });


            if (phone_no_1) user.phone_numbers[0] = phone_no_1
            if (phone_no_2) user.phone_numbers[1] = phone_no_2;
            if (req.body.location) {
                if (!isValidState(req.body.location)) {
                    return res.status(422).json({ error: true, message: "Invalid location" });
                }
                const location = {
                    human_readable: req.body.location,
                    coordinates: GeospatialDataNigeria[req.body.location],
                    type: "Point"
                }
                user.location = location;
            }

            const phoneNumberInUse = await User.findOne({ $or: [{ phone_no_1, phone_no_2 }] });
            if (phoneNumberInUse) {
                return res.status(400).json({ error: true, message: "Phone number in user!!" });
            }

            await user.save();
            return res.status(200).json({ success: true, message: "User details updated" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error occured while updating info" });
        }

    }

    static async getReferralHistory(req: Request, res: Response) {
        try {
            const transactions = await ReferralTransaction.find({ bearer: req.user?._id! }).populate(["referee"]);
            return res.status(200).json({ success: true, transactions });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error getting referral history" });
        }
    }

    static async updateDevicePushToken(req: Request, res: Response) {
        const { device_push_token } = req.body;
        try {
            const user = await User.findById(req.user?._id);
            if (!user) {
                return res.status(404).json({ error: true, message: "User not found!" });
            }

            // !todo => Valiadtion: Ensure that the device push token matches expo push token fmt
            user.device_push_token = device_push_token;
            await user.save();

            return res.status(200).json({ success: true, message: "Push token updated!" });

        } catch (error) {
            console.error(error);
            return res.status(500).json({error: true, message: "Error updating the push token"})
        }
    }

}

export default UserController;