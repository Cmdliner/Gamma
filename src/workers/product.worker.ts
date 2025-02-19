import { Job, Worker } from "bullmq";
import { redisConnection } from "../config/ioredis.config";
import Product from "../models/product.model";

const worker = new Worker('reviewQueue', async (job: Job) => {
    const { product_id } = job.data;

    const product = await Product.findById(product_id);
    if (!product) return;

    if (product.sponsorship.status === "under_review") {
        product.sponsorship.status = "active";
        await product.save();
    }
}, { connection: redisConnection });

worker.on('completed', (job: Job) => {
    console.log(`Review process completed for Product ${job.data.product_id}`);
})