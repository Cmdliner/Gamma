import type { Request, Response } from "express";
import User from "./user.model";
import IWallet from "../types/wallet.schema";
import PaystackService from "../lib/paystack.service";

class UserController {
    static async getUserInfo(req: Request, res: Response) {
        try {
            const user = await User.findById(req.user?._id!).select(["-password", "-bvn"])
                .populate([""]);
            if (!user) return res.status(404).json({ error: true, message: "User not found!" });

            return res.status(200).json({ success: true, user });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Couldn't fetch user details" });
        }
    }

    static async getReferralToken(req: Request, res: Response) {
        try {
            const user = await User.findById(req.user?._id!);
            if (!user) return res.status(404).json({ error: true, message: "User not found!" });

            return res.status(200).json({ success: true, referral_code: user.referral_code });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error fetching refeferral token" });
        }
    }

    static async getWalletBalance(req: Request, res: Response) {
        try {
            const user = await User.findById(req.user?._id).populate("wallet");
            if (!user) {
                return res.status(404).json({ error: true, message: "Could not get wallet balance" });
            }
            const balance = (user.wallet as any as IWallet).balance;
            return res.status(200).json({ success: true, balance });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error getting wallet balance" });
        }
    }

    static async getReferredUsers(req: Request, res: Response) {
        try {
            const user = await User.findById(req.user?._id)
                .populate("referrals")
                .select("referrals");
            if (!user || !user.referrals || !user.referrals.length) {
                return res.status(404).json({ error: true, message: "No referrals found" });
            }

            return res.status(200).json({ success: true, referrals: user.referrals });
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: true, message: "Error finding referrals" });
        }
    }

    static async editBankAccountDetails(req: Request, res: Response) {
        try {
            const { account_no, bank_code } = req.body;

            const bankDetails = req.user?.bank_details;
            if (!bankDetails) {
                return res.status(400).json({ error: true, message: "Cannot update bank details" });
            }

            const dateAdded = bankDetails?.added_at.valueOf();
            const threeMonthsFromDateAdded = dateAdded + (30 * 24 * 60 * 60 * 1000);

            // Check if 3 months has passed
            if (threeMonthsFromDateAdded > Date.now()) {
                return res.status(400).json({ error: true, message: "Cannot update bank account details" })
            }

            // Verify bank account with paystack
            const isValidBankAccount = await PaystackService.validateAccountDetails(account_no, bank_code);
            if (!isValidBankAccount) {
                return res.status(400).json({ error: true, message: "Invalid bank details" });
            }

            await User.findByIdAndUpdate(req.user?._id!, { "bank_details.account_no": account_no }, { new: true });
            return res.status(200).json({ error: true, message: "Bank details updated successfully!" });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error updating bank account details" })
        }

    }

    static async updateDisplayPicture(req: Request, res: Response) {
        const display_pic = req.file;
        console.log(display_pic?.path);
    }
}

export default UserController;