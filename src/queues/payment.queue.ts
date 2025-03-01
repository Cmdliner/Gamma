import { Queue } from "bullmq";
import { redis } from "../config/redis.config";
import { DelayDurationsInMs } from "../lib/utils";

const { twenty_mins } = DelayDurationsInMs;
export const ProductAvailabilityQueue = new Queue("product_availability", { connection: redis });

export async function makeProductAvailableForPurchase(transaction_id: string) {
    await ProductAvailabilityQueue.add(
        "make_product_available",
        { transaction_id },
        { delay: twenty_mins }
    );
}