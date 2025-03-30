import { startSession } from "mongoose";
import { ProductPurchaseTransaction, RefundTransaction } from "../models/transaction.model";
import Product from "../models/product.model";
import User from "../models/user.model";
import FincraService from "../services/fincra.service";

export class JobsService {

    /**
     * @description Auto refund buyers who requested refund
     *  and seller takes no action after 48 hrs 
     * @returns void
     */
    static async handleOverdueRefunds() {
        const session = await startSession();

        try {
            session.startTransaction();
            const pendingRefundTransactions = await RefundTransaction.find({
                status: "pending",
                $expr: {
                    $lt: [
                        { $add: ["$createdAt", 2 * 24 * 60 * 60 * 1000] },
                        new Date()
                    ]
                }
            }).session(session);

            if (pendingRefundTransactions.length === 0) { return }

            const refundTransactionsIds = pendingRefundTransactions.map(tx => tx._id);
            const associatedPaymentTxIds = pendingRefundTransactions.map(tx => tx.associated_payment_tx);
            const associatedProductsIds = pendingRefundTransactions.map(tx => tx.product);
            const mapOfUserIdToRefundAmount = pendingRefundTransactions.map(tx => {
                return { userId: tx.bearer, amount: tx.amount, ref: tx.id }
            });

            // Update refund transactions status to success
            await RefundTransaction.updateMany({
                _id: { $in: refundTransactionsIds }
            }, {
                status: "success"
            }).session(session);

            // Update associated payment transactions status to refunded
            await ProductPurchaseTransaction.updateMany({
                _id: { $in: associatedPaymentTxIds }
            }, {
                status: "refunded"
            }).session(session);

            // Make prod available for purchase again (purchase_lock, status)
            await Product.updateMany({
                _id: { $in: associatedProductsIds }
            }, {
                status: "available",
                purchase_lock: {
                    is_locked: false,
                    locked_at: undefined,
                    locked_by: undefined,
                    payment_link: undefined
                }
            }).session(session);

            // Batch refund to every bearer of refund tx, the amount to refund
            mapOfUserIdToRefundAmount.forEach(async x => {
                const user = await User.findById(x.userId).session(session);
                if (!user) {
                    console.error(`User with ${x.userId} not found`);
                    return;
                }
                await FincraService.handleRefund(user, x.amount, x.ref);
            });

        } catch (error) {
            await session.abortTransaction();
            console.error("Error while trying to autorefund to buyer");
            console.error(error);
        } finally {
            await session.endSession();
        }
    }

    /**
     * @description - Deletes users who opened account for over a week
     *  and haven't completed onboarding
     */
    static async deactivatePartiallyOnboardedUsers() {
        try {
            await User.deleteMany({
                $expr: {
                    $add: ["$createdAt", 7 * 24 * 60 * 60 * 1000]
                },
                $or: [
                    { email_verified: false },
                    { password: { $exists: false } },
                    { bank_details: { $exists: false } },
                    { identity: { $exists: false } }
                ]
            });
        } catch (error) {
            console.error("Error while trying to deactivate partially onboarded users");
            console.error(error);
        }

    }
}