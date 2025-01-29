import cron from 'node-cron';
import { JobsService } from './jobs.service';

export class CronScheduler {

    /**
     * @description This job runs everyday at midnight
     */
    static async runDailyAtMidnight() {
        cron.schedule("0 * * *", () => {
            JobsService.handleOverdueRefunds()
            JobsService.deactivatePartiallyOnboardedUsers();
        })
    }

    static async testCron() {
        cron.schedule("* * * * *", () => {
            console.log(`Running @ ${new Date().toISOString()}`)
        })
    }
}