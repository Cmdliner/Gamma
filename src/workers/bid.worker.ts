import { Job, Worker } from "bullmq";
import { redis } from "../config/redis.config";
import DB from "../config/db.config";
import Bid from "../models/bid.model";


async function setupBidWorkers() {
    await DB.connect();
    const bidExpiryWorker = new Worker("bidExpiry", async (job: Job) => {
        const { bid_id } = job.data;
    
        const bid = await Bid.findById(bid_id);
        if (!bid) return;
    
        if (bid.status === "pending") {
            bid.status = "expired";
            await bid.save();
        }
    
    }, { connection: redis });
    
    bidExpiryWorker.on('completed', (job: Job) => {
        console.log(`Done with expiry attempt on bid ${job.data.bid_id}`);
    });
    
    bidExpiryWorker.on('failed', (job: Job, err: Error) => {
        console.error(`Error when trying to run ${job?.id}`, err);
    });
}

setupBidWorkers().catch(error => console.error(error));