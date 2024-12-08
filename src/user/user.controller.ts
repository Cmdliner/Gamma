import type { Request, Response } from "express";
import User from "./user.model";
import IWallet from "../types/wallet.schema";
import PaystackService from "../lib/paystack.service";
import { ProcessCloudinaryImage } from "src/middlewares/upload.middlewares";

class UserController {
    static async getUserInfo(req: Request, res: Response) {
        try {
            const user = await User.findById(req.user?._id!).select(["-password", "-bvn"]);
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

            return res.status(200).json({ error: true, message: "Display picture upload successful" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error updating display picture" })
        }
    }

    static async updateInfo(req: Request, res: Response) {
        const { phone_no_1, phone_no_2, location } = req.body;

        // !TODO => VALIDATE INPUTS AND HANDLE VERIFICATION DOCS UPLOAD

        try {
            const user = await User.findById(req.user?._id!);
            if (!user) return res.status(404).json({ error: true, message: "User not found!" });


            if (phone_no_1) user.phone_numbers[0] = phone_no_1
            if (phone_no_2) user.phone_numbers[1] = phone_no_2;
            if (location) user.location = location;

            await user.save();
            return res.status(200).json({ success: true, message: "User details updated" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error occured while updating info" });

        }

    }
}

export default UserController;