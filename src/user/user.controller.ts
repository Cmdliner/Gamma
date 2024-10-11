import type { Request, Response } from "express";
import User from "./user.model";
import IWallet from "../types/wallet.schema";

class UserController {
    static async getUserInfo(req: Request, res: Response) {
        try {
            const user = await User.findById(req.user?._id!).select(["-password", "-bvn"]);
            if (!user) return res.status(404).json({ error: "User not found!" });

            return res.status(200).json({ success: "User found!", user });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Couldn't fetch user details" });
        }
    }

    static async getReferralToken(req: Request, res: Response) {
        try {
            const user = await User.findById(req.user?._id!);
            if (!user) return res.status(404).json({ error: "User not found!" });

            return res.status(200).json({ success: "Referral token found", referral_code: user.referral_code });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Error fetching refeferral token" });
        }
    }

    static async getWalletBalance(req: Request, res: Response) {
        try {
            const user = await User.findById(req.user?._id).populate("wallet");
            if (!user) {
                return res.status(404).json({ error: "Could not get wallet balance" });
            }
            const balance = (user.wallet as any as IWallet).balance;
            return res.status(200).json({ success: true, balance });

        } catch (error) {

        }
    }
}

export default UserController;