import { Job, Worker } from "bullmq";
import { redis } from "../config/redis.config";
import Product from "../models/product.model";
import DB from "../config/db.config";
import { addAdsToExpiryQueue, addAdsToPreventStaleAdsQueue } from "../queues/product.queue";
import { AppUtils } from "../lib/utils";

async function setupProductWorkers() {
    await DB.connect();
    const adsReviewWorker = new Worker('productReview', async (job: Job) => {
        const { product_id } = job.data;
    
        const product = await Product.findById(product_id);
        if (!product) return;
    
        if (product.sponsorship.status === "under_review") {
            product.sponsorship.status = "active";
            await product.save();
        }
        await addAdsToPreventStaleAdsQueue(product_id);
    
        const delay = product.sponsorship.duration === "1Month"
            ? AppUtils.DelayDurationsInMs.one_month
            : AppUtils.DelayDurationsInMs.seven_days;
        await addAdsToExpiryQueue(product_id, delay);
    }, { connection: redis });
    
    adsReviewWorker.on('completed', (job: Job) => {
        console.log(`Review process completed for Product ${job.data.product_id}`);
    })
    
    adsReviewWorker.on('failed', (job: Job, err: Error) => {
        console.error(`Job ${job?.id} failed:`, err);
    });
    
    
    // Auto deactivate ads after one week
    const autoDeactivateAdsWorker = new Worker('preventStaleAds', async (job: Job) => {
            const { product_id } = job.data;
    
            const product = await Product.findById(product_id);
            if (!product) return;
    
            const adIsActive = product.sponsorship.status === "active";
            const hasNotExpired = Number(product.sponsorship.expires) > Date.now();
            if (adIsActive && hasNotExpired) {
                product.sponsorship.status = "deactivated";
                await product.save();
            }
    }, { connection: redis });
    
    autoDeactivateAdsWorker.on('completed', (job) => {
        console.log(`Product ${job.data.product_id} as been deactivated`);
    });
    
    autoDeactivateAdsWorker.on('failed', (job: Job, err: Error) => {
        console.log(`Deactivation failed for job ${job.id}`);
        console.error(err);
    });
    
    
    // Auto expire ads on duration of expiry
    const expireAdsWorker = new Worker('adsExpiry', async (job: Job) => {
        const { product_id } = job.data;
    
        const product = await Product.findById(product_id);
        if(!product) return;
    
        product.sponsorship.status = "expired";
        await product.save();
    
    }, { connection: redis });
    
    expireAdsWorker.on('completed', (job) => {
        console.log(`Ad for ${job.data.product_id} has expired`);
    });
    
    expireAdsWorker.on('failed', (job: Job, err: Error) => {
        console.log(`Expiry failed for job ${job.id}`);
        console.error(err);
    });
}

setupProductWorkers().catch(error => console.error(error));