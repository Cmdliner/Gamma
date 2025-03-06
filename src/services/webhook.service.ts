import Product from "../models/product.model";
import { startSession } from "mongoose";
import { ChargeSuccessPayload, IVirtualAccountTransferData, PayoutSuccessPayload } from "../types/webhook.schema";
import crypto from "crypto";
import { AdPayments } from "../types/ad.enums";
import {
    AdSponsorshipTransaction,
    ProductPurchaseTransaction,
    RefundTransaction,
    WithdrawalTransaction,
} from "../models/transaction.model";
import User from "../models/user.model";
import { cfg } from "../init";
import FincraService from "./fincra.service";
import { logger } from "../config/logger.config";
import { addProductToReviewQueue } from "../queues/product.queue";

class WebhookService {

    private static async validateWebhook(webhookSignature: string, payload: any) {
        const encryptedData = crypto
            .createHmac("SHA512", cfg.SAFE_HAVEN_IBS_CLIENT_ID)
            .update(JSON.stringify(payload))
            .digest("hex");
        const signatureFromWebhook = webhookSignature;

        return encryptedData === signatureFromWebhook;

    }

    static async handleSuccessfulProductPurchase(payload: IVirtualAccountTransferData) {
        const session = await startSession();
        try {
            session.startTransaction();
            if (payload.status === "Completed") {
                const [transaction_id, product_id] = payload.externalReference.split("::");
                console.log({ transaction_id, product_id });

                const product = await Product.findOne({
                    deleted_at: { $exists: false },
                    status: "processing_payment",
                    _id: product_id
                }).session(session);

                if (!product) throw new Error("Product not found");

                product.status = "sold";
                await product.save({ session });

                // Transaction
                const transaction = await ProductPurchaseTransaction.findById(transaction_id).session(session);
                if (!transaction) throw new Error("Transaction not found");
                
                transaction.status = "in_escrow";
                transaction.payment_ref = payload.paymentReference;
                await transaction.save({ session });

                await session.commitTransaction();
            }
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }

    static async handleProductSponsorPayment(payload: IVirtualAccountTransferData) {

        // Ads expire one week after payment plan chosen (i.e 7 days extra)
        const SevenDaysFromNowPlusXtra = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        const OneMonthFromNowPlusXtra = new Date(Date.now() + 37 * 24 * 60 * 60 * 1000);

        const session = await startSession();

        try {
            session.startTransaction();
            if (payload.status !== "Completed" || payload.isReversed) {
                return { success: false }
            }
            const amountPaid = payload.amount;
            const [transaction_id, product_id] = payload.externalReference.split("::");
            let expiry = new Date();

            if (amountPaid === AdPayments.weekly) expiry = SevenDaysFromNowPlusXtra;
            else if (amountPaid === AdPayments.monthly) expiry = OneMonthFromNowPlusXtra;

            // Update product expiry and active status
            const product = await Product.findByIdAndUpdate(product_id, {
                "sponsorship.sponsored_at": new Date(),
                "sponsorship.expires": expiry,
                "sponsorship.status": "under_review",
            }, { new: true, session });
            if (!product) throw new Error();

            // Add product to review queue
            await addProductToReviewQueue(product.id);

            // Update transaction status
            await AdSponsorshipTransaction.findByIdAndUpdate(transaction_id, {
                payment_ref: payload.paymentReference,
                status: "success"
            }, { new: true, session });

            await session.commitTransaction();

            return { success: true, message: "Ad Payment received" }
        } catch (error) {
            await session.abortTransaction();
            console.error(error);
            throw error;
        } finally {
            await session.endSession();
        }
    }

    static async handlePayout(payload: PayoutSuccessPayload) {
        const session = await startSession();
        try {
            session.startTransaction();
            if (payload.data.status === "successful") {
                const transactionRef = payload.data.customerReference;

                const withdrawal = await WithdrawalTransaction.findById(transactionRef).session(session);
                if (!withdrawal) {
                    throw new Error("Withdrawal transaction not found!")
                }
                const user = await User.findById(withdrawal.bearer).session(session);
                if (!user) throw new Error("User not found!");

                if (withdrawal.from === "wallet" || withdrawal.from === "rewards") {
                    withdrawal.status = "success";
                    await withdrawal.save({ session });
                }
                await session.commitTransaction();
            }
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }

    static async handleRefunds(payload: ChargeSuccessPayload) {
        try {
            if (payload.data.status === "success") {

                const { product_id } = payload.data.metadata;
                const product = await Product.findById(product_id);
                product.status = "available";
                product.purchase_lock = undefined;
                await product.save();

                if (!product) throw new Error("Product not found");

                // Payment transaction
                const transaction = await ProductPurchaseTransaction.findById(payload.data.reference);
                if (!transaction) throw new Error("Transaction not found");
                if (payload.data.amountToSettle > 0 && payload.data.metadata.amount_expected > product.price) {
                    transaction.status = "failed";
                    transaction.payment_ref = payload.data.chargeReference
                    await transaction.save();
                }

                // User
                const user = await User.findById(transaction.bearer);
                if (!user) throw new Error("User not found");


                const OYEAH_REFUND_CUT = (0.55 / 100) * payload.data.amountReceived;
                const AMOUNT_TO_REFUND = payload.data.amountReceived - OYEAH_REFUND_CUT;

                // Create a new refund transaction
                const refundTransaction = await RefundTransaction.create({
                    amount: AMOUNT_TO_REFUND,
                    seller: product.owner,
                    associated_payment_tx: transaction._id,
                    status: "processing_payment",
                    bearer: transaction.bearer,
                    reason: `Refund for ${product.name} purchase due to underpayment`,
                    payment_method: "bank_transfer",
                    product: product._id
                });

                const result = await FincraService.handleRefund(user, AMOUNT_TO_REFUND, refundTransaction.id);
                return result
            }
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }

}

export default WebhookService;
