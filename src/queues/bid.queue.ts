import { Queue } from "bullmq";
import { redis } from "../config/redis.config";
import { DelayDurationsInMs } from "../lib/utils";

const { six_mins } = DelayDurationsInMs;
export const BidExpiryQueue = new Queue("bidExpiry", { connection: redis });

export async function addBidToExpiryQueue(bid_id: string) {
    await BidExpiryQueue.add("expire_bid", { bid_id }, { delay: six_mins });
}