import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL, {
maxRetriesPerRequest: null
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('disconnect', () => console.log('Redis disconnected'));
