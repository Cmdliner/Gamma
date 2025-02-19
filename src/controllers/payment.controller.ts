import { Request, Response } from "express";
import { startSession } from "mongoose";
import Wallet from "../models/wallet.model";
import FincraService from "../services/fincra.service";
import Transaction, {
    AdSponsorshipTransaction,
    ProductPurchaseTransaction,
    ReferralTransaction,
    RefundTransaction,
} from "../models/transaction.model";
import IUser from "../types/user.schema";
import Product from "../models/product.model";
import { compareObjectID, generateOTP } from "../lib/utils";
import { AdSponsorshipValidation, ItemPurchaseValidation } from "../validations/payment.validation";
import Bid from "../models/bid.model";
import { AdPayments } from "../types/ad.enums";
import User from "../models/user.model";
import { WithdrawalTransaction } from "../models/transaction.model";
import EmailService from "../services/email.service";
import OTP from "../models/otp.model";
import IProduct from "../types/product.schema";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../lib/error.handler";
import { logger } from "../config/logger.config";
import { PaymentService } from "../services/payment.service";

class PaymentController {

    static async withdrawFromWallet(req: Request, res: Response) {
        const MIN_WITHDRAWAL_VALUE = 500;
        const session = await startSession();

        try {
            const user = req.user as IUser;
            const { amount_to_withdraw } = req.body;

            if (!amount_to_withdraw) throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, "Amount required!");

            session.startTransaction();

            const wallet = await Wallet.findById(user.wallet).session(session);
            if (!wallet) throw new AppError(StatusCodes.NOT_FOUND, "Error finding wallet");

            // Make sure user does not try to add to their balance by atempting to withdraw 
            // negative balance or less than the MIN_WITHDRAW_VALUE
            if (amount_to_withdraw < MIN_WITHDRAWAL_VALUE) {
                throw new AppError(StatusCodes.BAD_REQUEST, "Amount too small");
            }
            // Check amount to withdraw
            if (amount_to_withdraw > wallet.main_balance) {
                throw new AppError(StatusCodes.BAD_REQUEST, "Insufficient funds!");
            }

            // Generate a new transaction for the payout
            const payoutTransaction = new WithdrawalTransaction({
                bearer: req.user?._id,
                amount: amount_to_withdraw,
                status: "pending",
                reason: `Payout: From Oyeah wallet to bank account: ${user.bank_details.account_no}`,
                payment_method: "bank_transfer",
                from: "wallet"
            });
            await payoutTransaction.save({ session });

            const txRef = payoutTransaction.id;
            const feeAndDisbursement = PaymentService.calculateCutAndAmountToDisburse(amount_to_withdraw);
            const withdrawalRes = await PaymentService.withdraw(
                "wallet",
                feeAndDisbursement.amount_to_withdraw,
                user,
                wallet,
                txRef
            );

            // Update balance and transaction once payout is not failed
            if (withdrawalRes.status === "success") {
                wallet.main_balance -= amount_to_withdraw;
                wallet.disbursement_fees += feeAndDisbursement.total_fee;
                await wallet.save({ session });
                // !todo => QUEUE a job to collect all oyeah_fees from everybody's wallet

                // Update transaction
                await WithdrawalTransaction.findByIdAndUpdate(
                    txRef,
                    { external_ref: withdrawalRes.data.reference },
                    { new: true, session }
                );
            }

            await session.commitTransaction();

            return res.status(200).json({ success: true, message: "Withdrawal has been initiated" })

        } catch (error) {
            await session.abortTransaction();
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error withdrawing money from wallet");
            return res.status(status).json(errResponse);
        } finally {
            await session.endSession();
        }
    }

    static async verifyPayment(_req: Request, _res: Response) { }

    static async getTransactionHistory(req: Request, res: Response) {
        try {
            const user = req.user as IUser;
            const transactions = await Transaction
                .find({ bearer: user._id })
                .sort({ createdAt: -1 }).populate("product");
            if (!transactions.length) throw new AppError(StatusCodes.NOT_FOUND, "No transactions yet");


            return res.status(StatusCodes.OK).json({ success: true, transactions });
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error getting transaction history");
            return res.send(status).json(errResponse);
        }
    }

    static async purchaseItem(req: Request, res: Response) {
        const session = await startSession();
        try {
            const userId = req.user?._id;
            const { productID, bidID } = req.params;
            const { payment_method, indempotence_key } = req.body;
            session.startTransaction();

            if (!payment_method) throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, `'payment_method' required!`);

            const user = await User.findById(userId).session(session);
            if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found!");

            const { error } = ItemPurchaseValidation.validate({ payment_method });
            if (error) throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, error.details[0].message);

            const product = await Product.findOne({
                _id: productID,
                deleted_at: { $exists: false },
            }).session(session);
            if (!product) throw new AppError(StatusCodes.NOT_FOUND, "Product not found!");
            if (product.status !== "available" || product.purchase_lock.is_locked) {
                throw new AppError(StatusCodes.BAD_REQUEST, "Product not available!");
            }

            // Check if this request is for a bid
            let bidPrice = undefined;
            if (bidID) {
                const bid = await Bid.findOne({ _id: bidID, status: "accepted" }).session(session);
                if (!bid) throw new AppError(StatusCodes.NOT_FOUND, "Couldn't find that bid");

                // if bid has expired update status, commit tx to db && return early.
                if (bid.expires.valueOf() < Date.now()) {
                    bid.status = "expired";
                    await bid.save({ session });
                    await session.commitTransaction();
                    return res.status(StatusCodes.BAD_REQUEST).json({ error: true, message: "Bid expired!" });
                }

                const isBidder = compareObjectID(bid.buyer, req.user?._id);
                if (!isBidder) throw new AppError(StatusCodes.NOT_FOUND, "Bid not found")

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
                throw new AppError(StatusCodes.LOCKED, "Product is currently unavaliable for purchase");
            }

            const itemPurchaseTransaction = new ProductPurchaseTransaction({
                bearer: userId,
                amount: bidPrice ? bidPrice : product.price,
                seller: updatedProduct.owner,
                status: "pending",
                product: productID,
                reason: `For the purchase of ${product.name}`,
                payment_method
            });
            await itemPurchaseTransaction.save({ session });
            const txRef = itemPurchaseTransaction.id;

            const amountToPay = bidPrice ? bidPrice : product.price;
            const { payment_error, message, ...payment_details } = await PaymentService.generateProductPurchaseAccountDetails(
                amountToPay,
                product
            );
            if (payment_error) throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, message);
            await session.commitTransaction();

            return res.status(StatusCodes.OK).json({ success: true, transaction_id: txRef, payment_details });
        } catch (error) {
            await session.abortTransaction();
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error purchasing item");
            return res.status(status).json(errResponse);
        } finally {
            await session.endSession();
        }
    }

    static async sponsorAd(req: Request, res: Response) {
        const session = await startSession();
        try {
            const { productID } = req.params;
            const { sponsorship_duration, payment_method, indempotence_key } = req.body;
            const amountToPay = sponsorship_duration === "1Week" ? AdPayments.weekly : AdPayments.monthly;

            if (!sponsorship_duration || !payment_method) {
                throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, `"sponsorship_duration" and "payment_method" required!`);
            }

            const { error } = AdSponsorshipValidation.validate({ sponsorship_duration, payment_method });
            if (error) throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, error.details[0].message);

            session.startTransaction();

            const product = await Product.findOne({
                _id: productID,
                deleted_at: { $exists: false },
            }).session(session);
            if (!product) throw new AppError(StatusCodes.NOT_FOUND, `Product not found!`);

            const isProductOwner = compareObjectID(product.owner, req.user?._id);
            if (!isProductOwner) throw new AppError(StatusCodes.NOT_FOUND, `Product not found!`);

            // Check if product has pending sponsorship transactions
            const pendingSponsorshipTx = await AdSponsorshipTransaction.findOne({
                bearer: req.user?._id,
                product: product._id,
                status: "pending"
                // !todo => check for when it was created
            }).session(session);

            if (pendingSponsorshipTx || product.sponsorship.status === "processing_payment") {
                throw new AppError(StatusCodes.BAD_REQUEST, "Processing pending payments");
            }

            if (product.sponsorship?.expires?.valueOf() > Date.now()) {
                throw new AppError(StatusCodes.BAD_REQUEST, "Previous ad sponsorship is yet to expire");
            }

            if (product.status === "sold") throw new AppError(StatusCodes.BAD_REQUEST, "Product sold!");

            // Create Transaction for ad sponsorhsip
            const adsDurationFmt = sponsorship_duration === "1Week" ? "one week" : "one month";
            const transaction = new AdSponsorshipTransaction({
                bearer: req.user?._id,
                product: product._id,
                status: "pending",
                payment_method: payment_method,
                reason: `To run ads for ${product.name} for a duration of ${adsDurationFmt}`,
                amount: amountToPay
            });
            await transaction.save({ session });

            const { payment_error, message, ...payment_details } = await PaymentService.generateSponsorshipPaymentAccountDetails(
                amountToPay,
                product
            );
            if (payment_error) throw new AppError(StatusCodes.BAD_REQUEST, message);

            await session.commitTransaction();

            return res.status(StatusCodes.OK).json({
                success: true,
                transaction_id: transaction.id,
                payment_details
            });
        } catch (error) {
            await session.abortTransaction();
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error occured during while trying to sponsor product");
            return res.status(status).json(errResponse);
        } finally {
            await session.endSession();
        }
    }

    static async withdrawRewards(req: Request, res: Response) {
        const session = await startSession();
        session.startTransaction();
        try {
            const { amount }: { amount: number } = req.body;

            const user = await User.findById(req.user?._id).session(session);
            if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User  not found!");

            const wallet = await Wallet.findById(user.wallet).session(session);
            if (!wallet) throw new AppError(StatusCodes.NOT_FOUND, "Wallet not found!");

            if (amount > wallet.rewards_balance || wallet.main_balance < 100) {
                throw new AppError(StatusCodes.BAD_REQUEST, "Insuffecient funds!");
            }

            // Ensure user has made a transaction in the last 30 days
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const transactionsInThePast30Days = await Transaction.find({
                bearer: req.user?._id,
                kind: { $or: ["ProductPurchaseTransaction", "AdSponsorshipTransaction"] },
                createdAt: { $gte: thirtyDaysAgo }
            }).session(session);

            const canWithdrawRewards = !!transactionsInThePast30Days.length;
            if (!canWithdrawRewards) {
                throw new AppError(
                    StatusCodes.BAD_REQUEST,
                    "Cannot claim rewards. No 'transactions' in the past 30 days"
                );
            }

            // Create transaction
            const payoutTransaction = new WithdrawalTransaction({
                bearer: req.user?._id,
                amount: wallet.rewards_balance,
                status: "pending",
                reason: `Withdrawing rewards earned`,
                payment_method: "bank_transfer",
                from: "rewards"
            });
            await payoutTransaction.save({ session });

            const { payout_error, message, status } = await PaymentService.withdraw("rewards", amount, user, wallet, payoutTransaction.id);
            if (payout_error) throw new AppError(StatusCodes.BAD_REQUEST, message);

            const feeAndDisbursement = PaymentService.calculateCutAndAmountToDisburse(amount);
            // Update balance and transaction once payout is not failed
            if (status === "success") {
                wallet.rewards_balance -= amount;
                wallet.disbursement_fees += feeAndDisbursement.total_fee;
                await wallet.save({ session });
                // !todo => QUEUE a job to collect all oyeah_fees from everybody's wallet
            }

            await WithdrawalTransaction.findByIdAndUpdate(payoutTransaction._id, {
                status: "processing_payment"
            }).session(session);
            await session.commitTransaction();

            return res.status(StatusCodes.OK).json({
                success: true,
                message: "Rewards have been sent to account",
            });

        } catch (error) {
            await session.abortTransaction();
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error withdrawing rewards!");
            return res.status(status).json(errResponse);
        } finally {
            await session.endSession();
        }
    }

    static async initiateFundsTransfer(req: Request, res: Response) {
        try {
            const { transactionID } = req.params;

            const transaction = await ProductPurchaseTransaction.findOne({
                status: "in_escrow",
                bearer: req.user?._id,
                _id: transactionID,
            }).populate("product");
            if (!transaction) throw new AppError(StatusCodes.NOT_FOUND, "Transaction not found!");

            const fullName = `${req.user?.first_name} ${req.user?.last_name}`;
            const otp = new OTP({ kind: "funds_approval", owner: req.user?._id, token: generateOTP() });
            await otp.save();

            // Send email
            await EmailService.sendMail(req.user?.email!, fullName, 'funds_release', otp.token, transaction);

            return res.status(StatusCodes.OK).json({ success: true, seller_id: (transaction.product as unknown as IProduct).owner });
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error sending funds to seller");
            return res.status(status).json(errResponse);
        }
    }

    static async transferfunds(req: Request, res: Response) {
        const session = await startSession();
        try {
            session.startTransaction();
            const { seller_id, transaction_id, otp, indempotence_key } = req.body;

            // Validate and verify  otp entered
            const now = new Date();
            const otpMatch = await OTP.findOneAndDelete({
                kind: "funds_approval",
                owner: req.user?._id,
                token: otp,
                expires: { $gte: now },
            }).session(session);
            if (!otpMatch) throw new AppError(StatusCodes.BAD_REQUEST, "Invalid OTP!");

            // Find transaction and update its status
            const transaction = await ProductPurchaseTransaction.findOne({
                _id: transaction_id,
                status: "in_escrow"
            }).session(session);
            if (!transaction) throw new AppError(StatusCodes.NOT_FOUND, "Transaction not found!");

            transaction.status = "success";
            await transaction.save({ session });

            // Update seller's wallet balance
            const seller = await User.findById(seller_id).session(session);
            if (!seller) throw new AppError(StatusCodes.NOT_FOUND, "Seller not found!");

            const sellerWallet = await Wallet.findById(seller.wallet).session(session);
            if (!sellerWallet) throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Seller's wallet not found!");
            sellerWallet.main_balance += transaction.amount;
            await sellerWallet.save({ session });

            // Activate customer's account if dormant
            const customer = await User.findById(transaction.bearer).session(session);
            if (!customer) throw new AppError(StatusCodes.NOT_FOUND, "Customer not found");

            if (customer.account_status === "dormant") {
                customer.account_status = "active";
                if (customer.referred_by) {
                    const AMOUNT_TO_REWARD = (0.5 / 100) * transaction.amount;
                    const referrer = await User.findById(customer.referred_by).session(session);
                    if (!referrer) throw new Error("Referrer not found");

                    const referrerWallet = await Wallet.findById(referrer.wallet);
                    if (!referrerWallet) throw new Error("Referrer wallet not found");

                    referrerWallet.rewards_balance += AMOUNT_TO_REWARD;
                    await referrerWallet.save({ session });

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
            return res.status(StatusCodes.OK).json({ success: true });
        } catch (error) {
            await session.abortTransaction();
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error sending funds!");
            return res.status(status).json(errResponse);
        } finally {
            await session.endSession();
        }
    }

    // Buyer request funds
    static async requestRefund(req: Request, res: Response) {
        const session = await startSession();
        try {
            session.startTransaction();
            const { transactionID } = req.params;

            // Get the previous payment transaction
            const prevTransaction = await ProductPurchaseTransaction.findOne({
                bearer: req.user?._id,
                _id: transactionID,
                status: 'in_escrow'
            }).session(session);
            if (!prevTransaction) throw new AppError(StatusCodes.NOT_FOUND, "Transaction not found!");

            // ! DO NOT TAMPER OR ALTER
            const OYEAH_REFUND_CUT = ((0.55 / 100 * prevTransaction.amount) * 10 / 10);
            const AMOUNT_TO_REFUND = prevTransaction.amount - OYEAH_REFUND_CUT;

            // Create a new refund transaction with amount to refund & reason
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
            return res.status(StatusCodes.OK).json({ success: true, message: "Seller has been notified of request to refund" });
        } catch (error) {
            await session.abortTransaction();
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Failed to request refund");
            return res.status(status).json(errResponse);
        } finally {
            await session.endSession();
        }
    }

    // Seller approves refund
    static async approveRefund(req: Request, res: Response) {
        const session = await startSession();
        try {
            const { refundTransactionID } = req.params;

            session.startTransaction();

            const refundTransaction = await RefundTransaction.findOne({
                status: 'pending',
                _id: refundTransactionID,
            }).populate(["product", "bearer"]).session(session);
            if (!refundTransaction) throw new AppError(StatusCodes.NOT_FOUND, "Refund transaction not found");

            const isSeller = compareObjectID(req.user?._id, refundTransaction.seller);
            if (!isSeller) throw new AppError(StatusCodes.NOT_FOUND, "Transaction not found");

            refundTransaction.status = "success";
            await refundTransaction.save({ session });

            // Get the associated payment tx from refund tx
            const associatedPaymentTransaction = await ProductPurchaseTransaction.findOne({
                _id: refundTransaction.associated_payment_tx,
                status: 'in_escrow',
                bearer: refundTransaction.bearer,
            }).populate(["product"]).session(session);
            if (!associatedPaymentTransaction) {
                throw new AppError(StatusCodes.NOT_FOUND, "Associated payment transaction not found!");
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
            if (!product) throw new AppError(StatusCodes.NOT_FOUND, "Product not found!");

            product.status = "available";
            product.purchase_lock = {
                is_locked: false,
                locked_by: undefined,
                locked_at: undefined
            };
            
            await product.save({ session });

            // Send money to user bank using fincra
            const buyer = refundTransaction.bearer as unknown as IUser;
            // !todo => Use safehaven api for refunds
            await FincraService.handleRefund(
                buyer,
                refundTransaction.amount,
                refundTransaction.id
            );

            // ! todo => Send notification to user
            await EmailService.sendMail(buyer.email, "", "payment_refund", null, refundTransaction.id)

            await session.commitTransaction();
            return res.status(StatusCodes.OK).json({ success: true, message: "Refund successful!" });
        } catch (error) {
            await session.abortTransaction();
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Refund approval failed!");
            return res.status(status).json(errResponse);
        } finally {
            await session.endSession();
        }
    }

    static async getSuccessfulDeals(req: Request, res: Response) {
        try {
            const deals = await ProductPurchaseTransaction.find({
                $or: [{ seller: req.user?._id, bearer: req.user?._id }],
                status: "success"
            });
            if (!deals || !deals.length) {
                return res.status(404).json({ error: true, message: "No deals found!" });
            }
            return res.status(200).json({ success: true, deals });
        } catch (error) {
            logger.error(error);
            return res.status(500).json({ error: true, message: "Error getting deals at this moment" });
        }
    }

    static async getDisputedDeals(req: Request, res: Response) {
        try {
            const deals = await ProductPurchaseTransaction.find({
                $or: [{ seller: req.user?._id, bearer: req.user?._id }],
                status: "in_dispute"
            });
            if (!deals) {
                return res.status(404).json({ error: true, message: "No deals found" })
            }
            return res.status(200).json({ success: true, deals });
        } catch (error) {
            logger.error(error);
            return res.status(500).json({ error: true, message: "Error getting deals at the moment" });
        }
    }

    static async getFailedDeals(req: Request, res: Response) {
        try {
            const deals = await ProductPurchaseTransaction.find({
                $or: [{ seller: req.user?._id, bearer: req.user?._id }],
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
            logger.error(error);
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
            logger.error(error);
            return res.status(500).json({ error: true, message: "Error getting ongoing dealas" })
        }
    }

}

export default PaymentController;