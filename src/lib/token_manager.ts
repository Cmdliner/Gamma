import { redis } from "../config/redis.config";
import { PaymentService } from "../services/payment.service";

const TOKEN_KEY = "safehaven:access_token";
const EXPIRY_KEY = "safehaven:token_expiry";
const LOCK_KEY = "safehaven:token_lock";
const LOCK_TIMEOUT = 5; // seconds to prevent race conditions
const BUFFER_TIME = 30000; // 30 seconds buffer before expiration

export class TokenManager {
    static async getToken(): Promise<string> {
        let token = await redis.get(TOKEN_KEY);
        const expiry = await redis.get(EXPIRY_KEY);
        const currentTime = Date.now();

        // If token exists and is still valid (with buffer time), return it
        if (token && expiry && currentTime < Number(expiry) - BUFFER_TIME) {
            return token;
        }

        // Use a lock to prevent multiple instances from generating a new token
        // Fix for TypeScript error - using the correct syntax for ioredis
        const lock = await redis.set(
            LOCK_KEY, 
            "locked", 
            "EX", 
            LOCK_TIMEOUT, 
            "NX"
        );

        if (!lock) {
            // If another instance is refreshing, wait and retry
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return this.getToken();
        }

        try {
            // Check again if token was refreshed by another process while we were waiting for the lock
            token = await redis.get(TOKEN_KEY);
            const freshExpiry = await redis.get(EXPIRY_KEY);
            
            if (token && freshExpiry && currentTime < Number(freshExpiry) - BUFFER_TIME) {
                return token;
            }
            
            // If not, refresh the token
            token = await this.refreshAccessToken();
            return token;
        } finally {
            // Always release lock
            await redis.del(LOCK_KEY);
        }
    }

    private static async refreshAccessToken(): Promise<string> {
        try {
            const { access_token } = await PaymentService.generateSafehavenAuthToken();

            if (!access_token) {
                throw new Error("Invalid token response from SafeHaven");
            }

            const token = access_token;
            const expiryTime = Date.now() + 14 * 60 * 1000; // 14 minutes in milliseconds

            // Store both values in Redis with the same expiration
            const tokenTTL = Math.floor(14 * 60); // 14 minutes in seconds
            
            // Use a pipeline for atomic operations
            await redis.pipeline()
                .set(TOKEN_KEY, token, "EX", tokenTTL)
                .set(EXPIRY_KEY, expiryTime.toString(), "EX", tokenTTL)
                .exec();

            return token;
        } catch (error) {
            console.error("Failed to refresh SafeHaven access token:", error);
            throw new Error("Failed to refresh access token");
        }
    }
}