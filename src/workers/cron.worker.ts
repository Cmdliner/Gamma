import { Job, Worker } from "bullmq";

async function setupJobs() {
    const midnightWorker = new Worker("midnight", async(job: Job) => {
        const {} = job.data;
    });
}

setupJobs();