import { Queue } from "bullmq";
import { redis } from "../config/redis.config";
import { AppUtils } from "../lib/utils";

const { twenty_mins } = AppUtils.DelayDurationsInMs;
export const ProductAvailabilityQueue = new Queue("product_availability", { connection: redis });

export async function makeProductAvailableForPurchase(transaction_id: string) {
    await ProductAvailabilityQueue.add(
        "make_product_available",
        { transaction_id },
        {
            attempts: 3,
            backoff: { type: 'exponential', delay: 10_000 },
            removeOnComplete: AppUtils.RmOnCompleteOpts,
            removeOnFail: AppUtils.RmOnFailOpts,
            delay: twenty_mins
        }
    );
}