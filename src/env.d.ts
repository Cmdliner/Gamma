declare namespace NodeJS {
    interface ProcessEnv {
        PORT: number;
        NODE_ENV: string;
        MONGO_URI: string;
        CORS_ORIGIN: string;
        EMAIL_ADDRESS: string;
        EMAIL_SERVICE: string;
        EMAIL_PASS: string;
        ACCESS_TOKEN_SECRET: string;
        ONBOARDING_TOKEN_SECRET: string;
        CORS_ORIGIN: string;
        SSL_KEY: string;
        SSL_CERT: string;
        FINCRA_PUBLIC_KEY: string;
        FINCRA_SECRET_KEY: string;
        FINCRA_WEBHOOK_KEY: string;
        PAYSTACK_URI: string;
        PAYSTACK_PUBLIC_KEY: string;
        PAYSTACK_SECRET_KEY: string;
        BVN_ENCRYPTION_KEY: string;
        CLOUDINARY_CLOUD_NAME: string;
        CLOUDINARY_SECRET: string;
        CLOUDINARY_API_KEY: string;
    }
}