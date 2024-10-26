import type { Request, Response } from "express";
import User from "./user.model";
import IWallet from "../types/wallet.schema";

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
            const referredUsers = await User.findById(req.user?._id)
                .select("referrals")
                .populate("referrals");
            if (!referredUsers) {
                return res.status(200).json({ error: true, message: "No referrals found" });
            }
            return res.status(200).json({ success: true, referrals: referredUsers });
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: true, message: "Error finding referrals" });
        }
    }

    static async editBankAccountDetails(req: Request, res: Response) {
        try {
            const { account_no } = req.body;
            //!TODO => Dont forget the 3 months from date added comparison required for acc update
            const userBankAccDetails = req.user?.account_details;
            // if(userBankAccDetails?.added_at.valueOf() < new Date().valueOf()) {}
            await User.findByIdAndUpdate(req.user?._id!, { "account_details.account_no": account_no });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error updating account details" })
        }

    }
}

export default UserController;