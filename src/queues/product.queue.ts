import { Queue } from "bullmq";
import { redisConnection } from "../config/ioredis.config";

export const ReviewQueue = new Queue('reviewQueue', { connection: redisConnection });

export async function addProductToReviewQueue(product_id: string) {
    await ReviewQueue.add('review_product', { product_id }, { delay: 15 * 60 * 1000});
    console.log(`Product ${product_id} is under review`)
}