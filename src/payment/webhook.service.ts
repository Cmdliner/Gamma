import Product from "../product/product.model";
import { startSession } from "mongoose";
import { ChargeSuccessPayload, PayoutSuccessPayload } from "../types/webhook.schema";
import crypto from "crypto";
import { AdPayments } from "../types/ad.enums";
import { AdSponsorshipTransaction, ProductPurchaseTransaction, RefundTransaction, WithdrawalTransaction } from "./transaction.model";
import User from "../user/user.model";
import { cfg } from "../init";
import FincraService from "../lib/fincra.service";
import EmailService from "../lib/email.service";
import IUser from "../types/user.schema";
import { logger } from "../config/logger.config";

class WebhookService {

    static async validateWebhook(webhookSignature: string, payload: any) {
        const encryptedData = crypto
            .createHmac("SHA512", cfg.FINCRA_WEBHOOK_KEY)
            .update(JSON.stringify(payload))
            .digest("hex");
        const signatureFromWebhook = webhookSignature;

        return encryptedData === signatureFromWebhook;

    }

    static async handleSuccessfulProductPurchase(payload: ChargeSuccessPayload) {
        const session = await startSession();
        try {
            session.startTransaction();
            if (payload.data.status === "success") {
                const { product_id } = payload.data.metadata;

                const product = await Product.findById(product_id).session(session);
                if (!product) throw new Error("Product not found");
                product.status = "sold";
                await product.save({ session });

                // Transaction
                const transaction = await ProductPurchaseTransaction.findById(payload.data.reference).session(session);
                if (!transaction) throw new Error("Transaction not found");
                if (payload.data.amountToSettle > 0 && payload.data.metadata.amount_expected === product.price) {
                    transaction.status = "in_escrow";
                    transaction.external_ref = payload.data.chargeReference
                    await transaction.save({ session });
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

    static async handleProductSponsorPayment(payload: ChargeSuccessPayload) {

        // Ads expire one week after payment plan chosen
        const SevenDaysFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        const OneMonthFromNow = new Date(Date.now() + 37 * 24 * 60 * 60 * 1000);

        const session = await startSession();

        try {
            session.startTransaction();
            const amountPaid = payload.data.amountToSettle;
            let expiry = new Date();

            if (amountPaid === AdPayments.weekly) expiry = SevenDaysFromNow;
            else if (amountPaid === AdPayments.monthly) expiry = OneMonthFromNow;
            else {/*handle underpayments here */ }

            // Update product expiry
            const product = await Product.findByIdAndUpdate(payload.data.metadata.product_id, {
                "sponsorship.sponsored_at": new Date(),
                "sponsorship.expires": expiry
            }, { new: true, session }).populate("owner");
            if (!product) throw new Error();

            // Update transaction status
            const tx = await AdSponsorshipTransaction.findByIdAndUpdate(payload.data.reference, {
                external_ref: payload.data.chargeReference,
                status: "success"
            }, { new: true, session });

            const user = (product.owner as any as IUser);
            await EmailService.sendMailWithAttachment({
                kind: "ads_receipt",
                amount: tx.amount,
                tx_id: tx.id,
                to: user.email,
                user,
                destination: 'Oyeah Technologies Limited'
            });
            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            logger.error(error);
            throw error;
        } finally {
            await session.endSession();
        }
    }

    static async handlePayout(payload: PayoutSuccessPayload) {
        const session = await startSession();
        console.dir(payload);
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
                    transaction.external_ref = payload.data.chargeReference
                    await transaction.save();
                }
    
                // User
                const user = await User.findById(transaction.bearer);
                if(!user) throw new Error("User not found");
    
    
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
    
                const result  = await FincraService.handleRefund(user, AMOUNT_TO_REFUND, refundTransaction.id);
                return result
            }
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }

    /**
     * @description Handles Overpayments or underpayments
     */
    static async handlePaymentsVariance() {}

}

export default WebhookService;