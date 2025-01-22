import { Request, Response } from "express";
import { Types, startSession } from "mongoose";
import Wallet from "../user/wallet.model";
import FincraService from "../lib/fincra.service";
import Transaction, { AdSponsorshipTransaction, ProductPurchaseTransaction, ReferralTransaction, RefundTransaction } from "./transaction.model";
import IUser from "../types/user.schema";
import Product from "../product/product.model";
import { compareObjectID, generateOTP } from "../lib/utils";
import { AdSponsorshipValidation, ItemPurchaseValidation } from "../validations/payment.validation";
import Bid from "../bid/bid.model";
import { AdPayments } from "../types/ad.enums";
import User from "../user/user.model";
import { WithdrawalTransaction } from "./transaction.model";
import EmailService from "../lib/email.service";
import OTP from "../auth/otp.model";
import IProduct from "../types/product.schema";
import { SafeHavenService } from "../lib/safehaven.service";


class PaymentController {

    static async generateSafeHavenApiToken(req: Request, res: Response) {
        try {
            const tokens = await SafeHavenService.generateAuthToken();
            console.log(tokens);
            return res.status(200).json({ tokens });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error generating safehaven API token" });
        }
    }

    static async initVerification(req: Request, res: Response) {
        try {
            const verificationRes = await SafeHavenService.initiateVerification(req.user);
            console.log(verificationRes);
            return res.status(200).json({ error: true, message: verificationRes })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "An error occured" })
        }
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


            const product = await Product.findOne({ _id: productID, deleted_at: { $exists: false } }).session(session);
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
                "purchase_lock.is_locked": false,
                deleted_at: { $exists: false }
            }, {
                status: "processing_payment",
                purchase_lock: {
                    is_locked: true,
                    locked_at: Date.now(),
                    locked_by: userId,
                    payment_link: "" // !todo => Add payment link
                }
            }, { new: true, session });
            if (!updatedProduct) {
                await session.abortTransaction();
                return res.status(400).json({ error: true, message: "Product is currently unavaliable for purchase" });
            }

            // CREATE TRANSACTION FOR PRODUCT PURCHASE
            const itemPurchaseTransaction = new ProductPurchaseTransaction({
                bearer: userId,
                // set to negotiated price or actual price based on whether it's a bid or not
                amount: bidPrice ? bidPrice : product.price,
                seller: updatedProduct.owner,
                status: "pending",
                product: productID,
                reason: `For the purchase of ${product.name}`,
                payment_method
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

            const product = await Product.findOne({
                _id: productID,
                deleted_at: { $exists: false },
            }).session(session);
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
            if (product.sponsorship?.expires?.valueOf() > Date.now()) {
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
            const transaction = new AdSponsorshipTransaction({
                bearer: req.user?._id,
                product: product._id,
                status: "pending",
                payment_method: payment_method,
                reason: `To run ads for ${product.name} for a duration of ${adsDurationFmt}`,
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
            const transactionsInThePast30Days = await Transaction.find({
                bearer: req.user?._id,
                kind: { $or: ["ProductPurchaseTransaction", "AdSponsorhipTransaction", "RefundTransaction"] },
                createdAt: { $gte: thirtyDaysAgo }
            }).session(session);
            const canWithdrawRewards = transactionsInThePast30Days.length ? true : false;

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
            const transaction = await ProductPurchaseTransaction.findOne({
                status: "in_escrow",
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
            await EmailService.sendMail(req.user?.email!, fullName, 'funds_release', otp.token, transaction);

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
            const transaction = await ProductPurchaseTransaction.findOne({
                _id: transaction_id,
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
        const session = await startSession();
        try {
            const { transactionID } = req.params;

            session.startTransaction();

            // Get the previous payment transaction
            const prevTransaction = await ProductPurchaseTransaction.findOne({
                bearer: req.user?._id,
                _id: transactionID,
                status: 'in_escrow'
            }).session(session);
            if (!prevTransaction) {
                await session.abortTransaction();
                return res.status(404).json({ error: true, message: "Transaction not found!" });
            }

            // ! DO NOT TAMPER OR ALTER
            const OYEAH_REFUND_CUT = ((0.55 / 100 * prevTransaction.amount) * 10 / 10);
            const AMOUNT_TO_REFUND = prevTransaction.amount - OYEAH_REFUND_CUT;

            // CREATE A NEW REFUND TRANSACTION WITH AMOUNT TO REFUND & reason with ref to prevTransaction
            const refundTransaction = new RefundTransaction({
                payment_method: 'bank_transfer',
                associated_payment_tx: prevTransaction._id,
                product: prevTransaction.product,
                bearer: req.user?._id,
                amount: AMOUNT_TO_REFUND,
                status: 'pending',
                reason: `Refund of payment made in transaction ${prevTransaction.id}`
            });
            await refundTransaction.save({ session });

            // !TODO => SEND NOTIFICATION TO SELLER
            await session.commitTransaction();
            return res.status(200).json({ success: true, message: "Seller has been notified of request to refund" });
        } catch (error) {
            await session.abortTransaction();
            console.error(error);
            return res.status(500).json({ error: true, message: "Failed to request refund" });
        } finally {
            await session.endSession();
        }
    }

    // SELLER APPROVES REFUND
    static async approveRefund(req: Request, res: Response) {
        const session = await startSession();
        try {
            const { refundTransactionID } = req.params;

            session.startTransaction();

            // Get refund transaction from ID
            const refundTransaction = await RefundTransaction.findOne({
                status: 'pending',
                _id: refundTransactionID,
            }).populate(["product", "bearer"]).session(session);
            if (!refundTransaction) {
                await session.abortTransaction();
                return res.status(404).json({ error: true, message: "Refund transaction not found" });
            }

            // Ensure current user is seller => authorized to make this request
            const isSeller = compareObjectID(req.user?._id!, (refundTransaction.product as unknown as IProduct).owner);
            if (!isSeller) {
                await session.abortTransaction();
                return res.status(401).json({ error: true, message: "Unauthorized!" });
            }

            // Update refund transaction status to  success
            refundTransaction.status = "success";
            await refundTransaction.save({ session });

            // Get the associated payment transaction id from refund tx reason
            const associatedPaymentTransaction = await ProductPurchaseTransaction.findOne({
                _id: refundTransaction.associated_payment_tx,
                status: 'in_escrow',
                bearer: refundTransaction.bearer,
            }).populate(["product"]).session(session);
            if (!associatedPaymentTransaction) {
                await session.abortTransaction();
                return res.status(404).json({ error: true, message: "Associated payment transaction not found!" });
            }

            // Update tx status to refunded
            associatedPaymentTransaction.status = "refunded";
            await associatedPaymentTransaction.save();

            // Make product available to other users for purchase again
            const productId = (associatedPaymentTransaction.product as unknown as IProduct)._id;
            const product = await Product.findOne({
                _id: productId,
                deleted_at: { $exists: false },
            }).session(session);
            if (!product) {
                return res.status(404).json({ error: true, message: "Product not found!" });
            }
            product.purchase_lock = {
                is_locked: false,
                locked_by: undefined,
                locked_at: undefined,
                payment_link: undefined
            };
            product.status = "available";
            await product.save({ session });


            // Send money to user bank using fincra
            const buyer = refundTransaction.bearer as unknown as IUser;
            const refundResponse = await FincraService.handleRefund(
                buyer,
                refundTransaction.amount,
                refundTransaction.id
            );
            // ! todo => Send notification to user

            await session.commitTransaction();
            return res.status(200).json({ success: true, message: "Refund successful!" });
        } catch (error) {
            await session.abortTransaction();
            console.error(error);
            return res.status(500).json({ error: true, message: "Refund approval failed!" });
        } finally {
            await session.endSession();
        }
    }

    static async getSuccessfulDeals(req: Request, res: Response) {
        try {
            const deals = await ProductPurchaseTransaction.find({
                $or: [{ seller: req.user?._id!, bearer: req.user?._id! }],
                status: "success"
            });
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
            const deals = await ProductPurchaseTransaction.find({
                $or: [{ seller: req.user?._id!, bearer: req.user?._id! }],
                status: "in_dispute"
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

    static async getFailedDeals(req: Request, res: Response) {
        try {
            const deals = await ProductPurchaseTransaction.find({
                $or: [{ seller: req.user?._id!, bearer: req.user?._id! }],
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
            const deals = await ProductPurchaseTransaction.find({
                bearer: req.user?._id,
                status: "in_escrow"
            });
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