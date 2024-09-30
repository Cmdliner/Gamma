declare namespace NodeJS {
    interface ProcessEnv {
        PORT: number;
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
    }
}