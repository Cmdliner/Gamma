import { Job, Worker } from "bullmq";
import { redis } from "../config/redis.config";
import DB from "../config/db.config";
import { ProductPurchaseTransaction } from "../models/transaction.model";
import Product from "../models/product.model";
import { PaymentService } from "../services/payment.service";

async function setupPaymentWorkers() {
    await DB.connect();

    const restoreProductAvailabilityWorker = new Worker("product_availability", async (job: Job) => {
        
        const { transaction_id } = job.data;
    
        const paymentTx = await ProductPurchaseTransaction.findById(transaction_id);
        if (!paymentTx) return;
    
        const product = await Product.findById(paymentTx.product);
        if (!product) return;
    
        if (paymentTx.status === "processing_payment") {
    
            const result = await PaymentService.getVirtualTransactionStatus(paymentTx.virtual_account_id);
            // ! todo => RESULT 
    
            paymentTx.status = "failed";
            await paymentTx.save();
    
            product.status = "available";
            product.purchase_lock = {
                is_locked: false,
                locked_by: undefined,
                locked_at: undefined
            }
            await product.save();
        }
    }, { connection: redis });
    
    restoreProductAvailabilityWorker.on('completed', (job: Job) => {
        console.log(`Product availability job ran for ${job.data.transaction_id}`);
    });
    
    restoreProductAvailabilityWorker.on('failed', (job: Job, err: Error) => {
        console.log(`Product availability job failed for ${job?.id}`, err);
    });
}

setupPaymentWorkers().catch(error => console.error(error));