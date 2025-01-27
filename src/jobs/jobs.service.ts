import { ProductPurchaseTransaction, RefundTransaction } from "../payment/transaction.model";
import Product from "../product/product.model";
import User from "../user/user.model";

export class JobsService {

    /**
     * @description Auto refund buyers who requested refund
     *  and seller takes no action after 48 hrs 
     * @returns void
     * 
     */
    static async handleOverdueRefunds() {

        const pendingRefundTransactions = await RefundTransaction.find({
            status: "pending",
            $expr: {
                $lt: [
                    { $add: ["$createdAt", 2 * 24 * 60 * 60 * 1000] },
                    new Date()
                ]
            }
        });

        if (pendingRefundTransactions.length === 0) { return }

        const refundTransactionsIds = pendingRefundTransactions.map(prt => prt._id);
        const associatedPaymentTxIds = pendingRefundTransactions.map(prt => prt.associated_payment_tx);
        const associatedProductsIds = pendingRefundTransactions.map(prt => prt.product);

        // Update refund transactions status to success
        await RefundTransaction.updateMany({
            _id: { $in: refundTransactionsIds }
        }, {
            status: "success"
        });

        // Update associated payment transactions status to refunded
        await ProductPurchaseTransaction.updateMany({
            _id: { $in: associatedPaymentTxIds }
        }, {
            status: "refunded"
        });

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
        });

        // ! todo => Batch refund to every bearer of refund tx, the amount to refund
    }

    /**
     * @description - Deletes users who opened account for over a week
     *  and haven't completed onboarding
     */
    static async deactivatePartiallyOnboardedUsers() {
        await User.deleteMany({
            $or: [{
                email_verified: false,
                password: { $exists: false },
                bank_details: { $exists: false },
                bvn: { $exists: false }
            }]
        });
    }
}