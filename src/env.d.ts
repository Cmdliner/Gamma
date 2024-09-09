declare namespace NodeJS {
    interface ProcessEnv {
        PORT: number;
        MONGO_URI: string;
        CORS_ORIGIN: string;
    }
}