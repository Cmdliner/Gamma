declare namespace NodeJS {
    interface ProcessEnv {
        PORT: number;
        NODE_ENV: "staging" | "development" | "production";
        OYEAH_SERVER_URL: string;
        MONGO_URI: string;
        CORS_ORIGIN: string;
        EMAIL_ADDRESS: `${string}@${string}.com`;
        EMAIL_SERVICE: string;
        EMAIL_PASS: string;
        ACCESS_TOKEN_SECRET: string;
        REFRESH_TOKEN_SECRET: string;
        ONBOARDING_TOKEN_SECRET: string;
        CORS_ORIGIN: string;
        SSL_KEY: string;
        SSL_CERT: string;
        FINCRA_BUSINESS_ID: string;
        FINCRA_PUBLIC_KEY: string;
        FINCRA_SECRET_KEY: string;
        FINCRA_WEBHOOK_KEY: string;
        PAYSTACK_URI: string;
        PAYSTACK_PUBLIC_KEY: string;
        PAYSTACK_SECRET_KEY: string;
        CLOUDINARY_CLOUD_NAME: string;
        CLOUDINARY_SECRET: string;
        CLOUDINARY_API_KEY: string;
        OYEAH_MAIN_ACCOUNT_SAFEHAVEN: string;
        OYEAH_ESCROW_ACCOUNT_SAFEHAVEN: string;
        SAFE_HAVEN_CLIENT_ASSERTION: string;
        SAFE_HAVEN_CLIENT_ID: string;
        SAFE_HAVEN_IBS_CLIENT_ID: string;
        SAFE_HAVEN_IBS_USER_ID: string;
        SAFE_HAVEN_AUTH_TOKEN: string;
        SAFE_HAVEN_REFRESH_TOKEN: string;
        REDIS_URL: string;
    }
}