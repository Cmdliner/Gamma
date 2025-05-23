import { Queue } from "bullmq";
import { redis } from "../config/redis.config";
import { AppUtils } from "../lib/utils";

const { six_mins } = AppUtils.DelayDurationsInMs;
export const BidExpiryQueue = new Queue("bidExpiry", { connection: redis });

export async function addBidToExpiryQueue(bid_id: string) {
    // check if bid_id is in queue previously then rm it and add this new one
    await BidExpiryQueue.add("expire_bid",
        { bid_id }, 
        {
            attempts: 3,
            backoff: { type: 'exponential', delay: 10_000 },
            delay: six_mins, 
            removeOnComplete: AppUtils.RmOnCompleteOpts, 
            removeOnFail: AppUtils.RmOnFailOpts 
        }
    );
}