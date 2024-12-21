import Product from "../product/product.model";
import { startSession } from "mongoose";
import { ChargeSuccessPayload, PayoutSuccessPayload } from "../types/webhook.schema";
import crypto from "crypto";
import { AdPayments } from "../types/ad.enums";
import { PaymentTransaction } from "./transaction.model";
import User from "src/user/user.model";

class WebhookService {

    static async validateWebhook(webhookSignature: string, payload: any) {
        const encryptedData = crypto
            .createHmac("SHA512", process.env.FINCRA_WEBHOOK_KEY)
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
                const transaction = await PaymentTransaction.findById(payload.data.reference).session(session);
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
            }, { new: true, session });
            if (!product) throw new Error();

            // Activate user's account if dormant
            const user = await User.findById(product.owner).session(session);
            if (user.account_status === "dormant") {
                user.account_status = "active";
                await user.save({ session });
            }

            // Update transaction status
            await PaymentTransaction.findByIdAndUpdate(payload.data.reference, {
                external_ref: payload.data.chargeReference,
                status: "success"
            }, { new: true, session });
            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }

    static async handleRewardsPayout(payload: PayoutSuccessPayload) {
        try {
            if (payload.data.status === "successful") {

            }
        } catch (error) {
            throw error;
        }
    }

    static async handleBalancePayout(payload: any) { }
}

export default WebhookService;