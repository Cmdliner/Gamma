import { Queue } from "bullmq";
import { redis } from "../config/redis.config";
import { DelayDurationsInMs, RmOnCompleteOpts, RmOnFailOpts } from "../lib/utils";


const { fifteen_mins, seven_days } = DelayDurationsInMs;
export const ReviewQueue = new Queue('productReview', { connection: redis });
export const AdsExpiryQueue = new Queue('adsExpiry', { connection: redis });
export const PreventStaleAdsQueue = new Queue('preventStaleAds', { connection: redis });

export async function addProductToReviewQueue(product_id: string) {
    await ReviewQueue.add('review_product', { product_id }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10_000 },
        removeOnComplete: RmOnCompleteOpts,
        removeOnFail: RmOnFailOpts,
        delay: fifteen_mins
    });
    console.log(`Product ${product_id} is under review`)
}


export async function addAdsToPreventStaleAdsQueue(product_id: string) {
    await PreventStaleAdsQueue.add('fresh_ad', { product_id }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10_000 },
        removeOnComplete: RmOnCompleteOpts,
        removeOnFail: RmOnFailOpts,
        delay: seven_days
    });
    console.log(`Ad ${product_id} has been queued`);
}

export async function addAdsToExpiryQueue(product_id: string, delay: number) {
    await AdsExpiryQueue.add('ad_to_expire', { product_id }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10_000 },
        removeOnComplete: RmOnCompleteOpts,
        removeOnFail: RmOnFailOpts,
        delay
    });
}