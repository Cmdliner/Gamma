declare namespace NodeJS {
    interface ProcessEnv {
        PORT: number;
        MONGO_URI: string;
        CORS_ORIGIN: string;
        EMAIL_ADDRESS: string;
        EMAIL_SERVICE: string;
        EMAIL_PASS: stringl
    }
}