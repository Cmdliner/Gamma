import { Request, Response } from "express";
import { Types, startSession } from "mongoose";
import Wallet from "../user/wallet.model";
import FincraService from "../lib/fincra.service";
import Transaction, { ReferralTransaction } from "./transaction.model";
import IUser from "../types/user.schema";
import Product from "../product/product.model";
import { compareObjectID, generateOTP } from "../lib/main";
import { AdSponsorshipValidation, ItemPurchaseValidation } from "../validations/payment.validation";
import Bid from "../bid/bid.model";
import { AdPayments } from "../types/ad.enums";
import User from "../user/user.model";
import { PaymentTransaction, WithdrawalTransaction } from "./transaction.model";
import EmailService from "../lib/email.service";
import OTP from "../auth/otp.model";
import IProduct from "../types/product.schema";


class PaymentController {

    private static async getTransactionsAssociatedWithUser(userId: Types.ObjectId, status: string) {
        const transactions = await PaymentTransaction.aggregate([
            // First, look up the associated product details
            {
                $lookup: {
                    from: "products",
                    localField: "product",
                    foreignField: "_id",
                    as: "product"
                }
            },
            // Unwind the product array
            {
                $unwind: "$product"
            },
            // Look up the product owner's details
            {
                $lookup: {
                    from: "users",
                    localField: "product.owner",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                first_name: 1,
                                last_name: 1,
                                display_pic: 1
                            }
                        }
                    ],
                    as: "product.owner"
                }
            },
            // Unwind the owner array to convert it back to an object
            {
                $unwind: "$product.owner"
            },
            // Match transactions where user is either bearer or product owner
            {
                $match: {
                    $or: [
                        { bearer: new Types.ObjectId(userId) },
                        { "product.owner._id": new Types.ObjectId(userId) }
                    ],
                    status
                }
            },
            // Sort by creation date, most recent first
            {
                $sort: { createdAt: -1 }
            }
        ]);
        return transactions;
    }

    static async withdrawFromWallet(req: Request, res: Response) {
        const MIN_WITHDRAWAL_VALUE = 500;
        const session = await startSession();

        try {
            const user = req.user as IUser;
            const { amount_to_withdraw } = req.body;

            if (!amount_to_withdraw) {
                return res.status(422).json({ error: true, message: "amount required!" })
            }

            session.startTransaction();
            // Get user wallet
            const wallet = await Wallet.findById(user.wallet).session(session);
            if (!wallet) {
                await session.abortTransaction();
                return res.status(404).json({ error: true, message: "Error finding wallet" });
            }

            // Make sure user does not try to add to their balance by atempting to withdraw 
            // negative balance or less than the MIN_WITHDRAW_VALUE
            if (amount_to_withdraw < MIN_WITHDRAWAL_VALUE) {
                await session.abortTransaction();
                return res.status(400).json({ error: true, message: "Amount too small" });
            }
            // Check amount to withdraw
            if (amount_to_withdraw > wallet.balance) {
                await session.abortTransaction();
                return res.status(400).json({ error: true, message: "Insufficient funds!" });
            }

            // Generate a new transaction for the payout
            const payoutTransaction = new WithdrawalTransaction({
                for: "withdrawal",
                bearer: req.user?._id!,
                amount: amount_to_withdraw,
                status: "pending",
                reason: `Payout: From Oyeah wallet to bank account`,
                payment_method: "bank_transfer",
                from: "wallet"
            });
            await payoutTransaction.save({ session });

            // Get transaction reference
            const transactionRef = payoutTransaction.id;

            // Attempt to transfer to user bank acc using fincra
            const withdrawalRes = await FincraService.withdrawFunds(user, transactionRef, amount_to_withdraw);
            // Update balance and transaction once payout is not failed
            if (withdrawalRes.success) {
                wallet.balance -= amount_to_withdraw;
                await wallet.save({ session });

                // Update transaction
                await WithdrawalTransaction.findByIdAndUpdate(
                    transactionRef,
                    { external_ref: withdrawalRes.data.reference },
                    { new: true, session }
                );
            }

            await session.commitTransaction();

            return res.status(200).json({ success: true, message: "Withdrawal has been initiated" })

        } catch (error) {
            await session.abortTransaction();
            console.error(error);
            return res.status(500).json({ error: true, message: "Error withdrawing money from wallet" });
        } finally {
            await session.endSession();
        }
    }

    // !TODO => verify transaction
    static async verifyPayment(req: Request, res: Response) {
    }

    static async getTransactionHistory(req: Request, res: Response) {
        try {
            const user = req.user as IUser;
            const transactions = await Transaction.find({ bearer: user._id }).sort({ createdAt: -1 }).populate("product");
            return res.status(200).json({ success: true, message: "Transactions found", transactions });
        } catch (error) {
            console.error(error);
            return res.send(500).json({ error: true, message: "Error getting transaction history" });
        }
    }

    static async purchaseItem(req: Request, res: Response) {
        const session = await startSession();
        try {
            const userId = req.user?._id;
            const { productID, bidID } = req.params;
            const { payment_method } = req.body;
            session.startTransaction();

            if (!payment_method) {
                return res.status(422).json({ error: true, message: "Payment method required!" })
            }

            const user = await User.findById(userId).session(session);
            if (!user) {
                await session.abortTransaction();
                return res.status(404).json({ error: true, message: "User not found!" })
            }


            // VALIDATION LOGIC
            const { error } = ItemPurchaseValidation.validate({ payment_method });
            if (error) {
                await session.abortTransaction();
                return res.status(422).json({ error: true, message: error.details[0].message });
            }


            const product = await Product.findById(productID).session(session);
            if (!product || product.status !== "available") {
                await session.abortTransaction();
                return res.status(400).json({ error: true, message: "Product not available!" });
            }

            // CHECK IF THIS REQUEST IS FOR A BID
            let bidPrice = undefined; // Initialize bid price
            if (bidID) {
                const bid = await Bid.findOne({ _id: bidID, status: "accepted" }).session(session);
                if (!bid) {
                    await session.abortTransaction();
                    return res.status(404).json({ error: true, message: "Couldn't find bid" });
                }

                // Ensure bid has not yet expired
                if (bid.expires.valueOf() < Date.now()) {
                    bid.status = "expired";
                    await bid.save({ session });
                    return res.status(400).json({ error: true, message: "Bid expired!" })
                }

                const isBidder = compareObjectID(bid.buyer, req.user?._id!);
                if (!isBidder) return res.status(400).json({ error: true, message: "Action Forbidden!" });

                // Set bid Price to that negotiated
                bidPrice = bid.negotiating_price as number;
            }

            const updatedProduct = await Product.findOneAndUpdate({
                _id: productID,
                status: "available",
                "purchase_lock.is_locked": false
            }, {
                status: "processing_payment",
                purchase_lock: {
                    is_locked: true,
                    locked_at: Date.now(),
                    locked_by: userId,
                }
            }, { new: true, session });
            if (!updatedProduct) {
                await session.abortTransaction();
                return res.status(400).json({ error: true, message: "Product is currently unavaliable for purchase" });
            }

            // CREATE TRANSACTION FOR PRODUCT PURCHASE
            const itemPurchaseTransaction = new PaymentTransaction({
                bearer: userId,
                // set to negotiated price or actual price based on whether it's a bid or not
                amount: bidPrice ? bidPrice : product.price,
                status: "pending",
                product: productID,
                reason: `Product purchase: \nFor the purchase of ${product.name}`,
                payment_method,
                for: "product_payment"
            });
            await itemPurchaseTransaction.save({ session });
            const transactionRef = itemPurchaseTransaction.id;


            // Initiate payment with fincra then commit transaction to db
            const fincraResponse = await FincraService.purchaseItem(product, req.user!, transactionRef, payment_method, bidPrice);
            await session.commitTransaction();

            return res.status(200).json({ success: true, transaction_id: itemPurchaseTransaction._id, fincra: fincraResponse });


        } catch (error) {
            await session.abortTransaction();
            console.error(error);
            return res.status(500).json({ error: true, message: "Error purchasing item" });
        } finally {
            await session.endSession();
        }
    }

    static async sponsorAd(req: Request, res: Response) {

        const { productID } = req.params;
        const { sponsorship_duration, payment_method } = req.body;

        const session = await startSession();

        try {
            if (!sponsorship_duration || !payment_method) {
                return res.status(422).json({ error: true, message: "sponsorship_duration and payment_method required!" });
            }

            // VALIDATE SPONSORSHIP DURATION AND PAYMENT METHOD
            const { error } = AdSponsorshipValidation.validate({ sponsorship_duration, payment_method });
            if (error) {
                return res.status(422).json({ error: true, message: error.details[0].message });
            }

            // START TRANSACTION
            session.startTransaction();

            const product = await Product.findById(productID).session(session);
            if (!product) {
                await session.abortTransaction();
                return res.status(404).json({ error: true, message: "Product not found!" });
            }

            const isProductOwner = compareObjectID(product.owner, req.user?._id!);
            if (!isProductOwner) {
                await session.abortTransaction();
                return res.status(400).json({ error: true, message: "Forbidden!!!" });
            }

            // CHECK IF AD SPONOSRHIP IS NOT YET EXPIRED
            if ((product.sponsorship?.expires?.valueOf() || 1) > Date.now()) {
                await session.abortTransaction();
                return res.status(400).json({ error: true, message: "" });
            }

            // CHECK IF PRODUCT IS SOLD
            if (product.status === "sold") {
                await session.abortTransaction();
                return res.status(400).json({ error: true, message: "Product sold!" })
            }

            // Create Transaction for ad sponsorhsip
            const adsDurationFmt = sponsorship_duration == "1Week" ? "one week" : "one month";
            const transaction = new PaymentTransaction({
                for: "ad_sponsorship",
                bearer: req.user?._id,
                product: product._id,
                status: "pending",
                payment_method: payment_method,
                reason: `Product sponsorship:\n To run ads for ${product.name} for a duration of ${adsDurationFmt}`,
                amount: sponsorship_duration === "1Week" ? AdPayments.weekly : AdPayments.monthly
            })
            await transaction.save({ session });

            const fincraRes = await FincraService.sponsorProduct(product, req.user!, sponsorship_duration, transaction.id, payment_method);

            await session.commitTransaction();

            return res.status(200).json({ success: true, transaction_id: transaction.id, fincra: fincraRes })
        } catch (error) {
            await session.abortTransaction();
            console.error(error);
            return res.status(500).json({ error: true, message: "Error occured during while trying to sponsor product" });
        } finally {
            await session.endSession();
        }
    }

    static async withdrawRewards(req: Request, res: Response) {
        const session = await startSession();
        session.startTransaction();
        try {
            const { amount }: { amount: number } = req.body;
            const userId = req.user?._id;
            const user = await User.findById(userId).session(session);
            if (!user) {
                await session.abortTransaction();
                return res.status(404).json({ error: true, message: "User  not found!" });
            }

            if (amount > user.rewards.balance || user.rewards.balance < 100) {
                return res.status(400).json({ error: true, message: "Insuffecient funds!" });
            }

            // Ensure user has made a transaction in the last 30 days
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const transactionsInThePast30Days = await PaymentTransaction.find({
                createdAt: { $gte: thirtyDaysAgo }
            }).session(session);
            const canWithdrawRewards = transactionsInThePast30Days.length ? true : false;
            // /* !REMOVE IN PROD */ const canWithdrawRewards = true;

            if (!canWithdrawRewards) {
                await session.abortTransaction();
                return res.status(400)
                    .json({
                        error: true,
                        message: "Cannot claim rewards. No 'transactions' in the past 30 days",
                    });
            }
            // Create transaction
            const payoutTransaction = new WithdrawalTransaction({
                for: "withdrawal",
                bearer: userId,
                amount: user.rewards.balance,
                status: "pending",
                reason: `Withdrawing rewards earned`,
                payment_method: "bank_transfer",
                from: "rewards"
            });
            await payoutTransaction.save({ session });

            const fincraRes = await FincraService.withdrawRewards(user, amount, payoutTransaction.id);
            // Handle response and service of rewards

            console.log("fincraResponse");
            console.log(fincraRes.data);
            console.log("End of fincraResponse");
            if (fincraRes.data.status === "failed") { throw new Error() }
            await WithdrawalTransaction.findByIdAndUpdate(payoutTransaction._id, {
                status: "processing_payment"
            }).session(session);
            await session.commitTransaction();

            return res.status(200).json({ success: true, message: "Rewards have been sent to account" });

        } catch (error) {
            await session.abortTransaction();
            console.error(error);
            return res.status(500).json({ error: true, message: "Error withdrawing rewards!" })
        } finally {
            await session.endSession();
        }
    }

    static async initiateFundsTransfer(req: Request, res: Response) {
        try {
            const { transactionID } = req.params;
            const transaction = await PaymentTransaction.findOne({
                status: "in_escrow",
                for: "product_payment",
                bearer: req.user?._id!,
                _id: transactionID,
            }).populate("product");
            if (!transaction) {
                return res.status(404).json({ error: true, message: "Transaction not found!" });
            }
            // Send otp to user to confirm transaction
            const fullName = `${req.user?.first_name} ${req.user?.last_name}`;
            const otp = new OTP({ kind: "funds_approval", owner: req.user!, token: generateOTP() });
            await otp.save();

            // Send email
            await EmailService.sendMail(req.user?.email!, fullName, 'funds_release', otp.token,  transaction);

            return res.status(200).json({ success: true, seller_id: (transaction.product as unknown as IProduct).owner });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Could not send funds to seller" });
        }
    }

    static async transferfunds(req: Request, res: Response) {
        const session = await startSession();
        try {
            session.startTransaction();
            const { seller_id, transaction_id, otp } = req.body;

            // Validate and verify  otp entered
            const now = new Date();
            const otpMatch = await OTP.findOneAndDelete({
                kind: "funds_approval",
                owner: req.user?._id!,
                token: otp,
                expires: { $gte: now },
            }).session(session);
            if (!otpMatch) {
                await session.abortTransaction();
                return res.status(400).json({ error: true, message: "Invalid OTP!" })
            }

            // Find transaction and update its status
            const transaction = await PaymentTransaction.findOne({
                _id: transaction_id,
                for: "product_payment",
                status: "in_escrow"
            }).session(session);
            if (!transaction) {
                await session.abortTransaction();
                return res.status(404).json({ error: true, message: "Transaction not found!" });
            }
            transaction.status = "success";
            await transaction.save({ session });

            // Update seller's wallet balance
            const seller = await User.findById(seller_id).session(session);
            if (!seller) {
                await session.abortTransaction();
                return res.status(404).json({ error: true, message: "Seller not found!" });
            }
            const sellerWallet = await Wallet.findById((seller.wallet)).session(session);
            if (!sellerWallet) throw new Error("Wallet not found");
            sellerWallet.balance += transaction.amount;
            await sellerWallet.save({ session });


            // Activate customer's account if dormant
            const customer = await User.findById(transaction.bearer).session(session);
            if (!customer) throw new Error("Customer not found");

            if (customer.account_status === "dormant") {
                customer.account_status = "active";

                if (customer.referred_by) {
                    const AMOUNT_TO_REWARD = (0.5 / 100) * transaction.amount;
                    const referrer = await User.findById(customer.referred_by).session(session);
                    if (!referrer) throw new Error("Referrer not found");
                    referrer.rewards.balance += AMOUNT_TO_REWARD;
                    await referrer.save({ session });

                    // CREATE TRANSACTION FOR THIS REFERRAL REWARD
                    const referralRewardTransaction = new ReferralTransaction({
                        for: "referral",
                        bearer: referrer._id,
                        amount: AMOUNT_TO_REWARD,
                        status: "success",
                        reason: `Reward for referral of ${customer.first_name + " " + customer.last_name}`,
                        referee: customer._id
                    });
                    await referralRewardTransaction.save({ session });
                }

            }
            await customer.save({ session });
            await session.commitTransaction();
            return res.status(200).json({ success: true });
        } catch (error) {
            await session.abortTransaction();
            console.error(error);
            return res.status(500).json({ error: true, message: "Error sending funds!" });
        } finally {
            await session.endSession()
        }
    }

    // BUYER REQUESTS REFUND
    static async requestRefund(req: Request, res: Response) {
        try {
            // !TODO => SEND NOTIFICATION TO SELLER
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Failed to request refund" });
        }
    }

    // SELLER APPROVES REFUND
    static async approveRefund(req: Request, res: Response) {
        try {
            // CHANGE PREVIOUS TRANSACTION STATE TO FAILED
            // UNLOCK PRODUCT
            // MOVE MONEY FROM ESCROW TO CUSTOMER ACCOUNT
            // THATS ALL FOR NOW (RETURN RESPONSE)
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Refund approval failed!" });
        }
    }

    static async getSuccessfulDeals(req: Request, res: Response) {
        try {
            const deals = await PaymentController.getTransactionsAssociatedWithUser(req.user?._id!, "success");
            if (!deals || !deals.length) {
                return res.status(404).json({ error: true, message: "No deals found!" })
            }
            return res.status(200).json({ success: true, deals });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error getting deals at this moment" });
        }
    }

    static async getDisputedDeals(req: Request, res: Response) {
        try {
            const deals = await PaymentController.getTransactionsAssociatedWithUser(req.user?._id!, "in_dispute");
            if (!deals) {
                return res.status(404).json({ error: true, message: "No deals found" })
            }
            return res.status(200).json({ success: true, deals });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error getting deals at the moment" });
        }
    }

    static async getFailedDeals(req: Request, res: Response) {
        try {
            const deals = await PaymentTransaction.find({
                $or: [{ "product.owner": req.user?._id!, bearer: req.user?._id! }],
                status: "failed",
            }).populate("bearer").populate({
                path: "product",
                populate: {
                    path: "bearer",
                    model: "User",
                },
            });
            if (!deals) {
                return res.status(404).json({ error: true, message: "No deals found" })
            }
            return res.status(200).json({ success: true, deals });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error getting deals at the moment" });
        }
    }

    static async getOngoingDeals(req: Request, res: Response) {
        try {
            const deals = await PaymentController.getTransactionsAssociatedWithUser(req.user?._id!, "in_escrow");
            if (!deals) {
                return res.status(404).json({ error: true, message: "User has no ongoing transactions" });
            }
            return res.status(200).json({ success: true, deals });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error getting ongoing dealas" })
        }
    }

}

export default PaymentController;