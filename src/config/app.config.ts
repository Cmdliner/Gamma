


export class AppConfig {

    PORT: number;
    DB_URI: string;
    NODE_ENV: 'production' | 'development' | 'staging';
    APP_EMAIL_ADDRESS: `${string}@${string}.com`;
    APP_EMAIL_SERVICE: string;
    APP_EMAIL_PASS: string;
    ACCESS_TOKEN_SECRET: string;
    REFRESH_TOKEN_SECRET: string;
    ONBOARDING_TOKEN_SECRET: string;
    FINCRA_SECRET_KEY: string;
    FINCRA_PUBLIC_KEY: string;
    FINCRA_WEBHOOK_KEY: string;
    PAYSTACK_URI: string;
    PAYSTACK_SECRET_KEY: string;
    PAYSTACK_PUBLIC_KEY: string;
    BVN_ENCRYPTION_KEY: string;
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_SECRET: string;
    CLOUDINARY_API_KEY: string;
    FINCRA_BUSINESS_ID: string;
    SAFE_HAVEN_CLIENT_ASSERTION: string;
    SAFE_HAVEN_CLIENT_ID: string;
    SAFE_HAVEN_IBS_CLIENT_ID:string;
    SAFE_HAVEN_IBS_USER_ID: string;
    SAFE_HAVEN_AUTH_TOKEN: string;
    SAFE_HAVEN_REFRESH_TOKEN: string;
    LOG_LEVEL: string;

    constructor(cfg: AppConfig) {

        this.PORT = cfg.PORT;
        this.DB_URI = cfg.DB_URI;
        this.NODE_ENV = cfg.NODE_ENV;
        this.APP_EMAIL_ADDRESS = cfg.APP_EMAIL_ADDRESS
        this.APP_EMAIL_SERVICE = cfg.APP_EMAIL_SERVICE;
        this.APP_EMAIL_PASS = cfg.APP_EMAIL_PASS;
        this.ACCESS_TOKEN_SECRET = cfg.ACCESS_TOKEN_SECRET;
        this.REFRESH_TOKEN_SECRET = cfg.REFRESH_TOKEN_SECRET;
        this.ONBOARDING_TOKEN_SECRET = cfg.ONBOARDING_TOKEN_SECRET;
        this.FINCRA_SECRET_KEY = cfg.FINCRA_SECRET_KEY;
        this.FINCRA_PUBLIC_KEY = cfg.FINCRA_PUBLIC_KEY;
        this.FINCRA_WEBHOOK_KEY = cfg.FINCRA_WEBHOOK_KEY;
        this.PAYSTACK_URI = cfg.PAYSTACK_URI;
        this.PAYSTACK_SECRET_KEY = cfg.PAYSTACK_SECRET_KEY;
        this.PAYSTACK_PUBLIC_KEY = cfg.PAYSTACK_PUBLIC_KEY;
        this.BVN_ENCRYPTION_KEY = cfg.BVN_ENCRYPTION_KEY;
        this.CLOUDINARY_CLOUD_NAME = cfg.CLOUDINARY_CLOUD_NAME;
        this.CLOUDINARY_SECRET = cfg.CLOUDINARY_SECRET;
        this.CLOUDINARY_API_KEY = cfg.CLOUDINARY_API_KEY;
        this.FINCRA_BUSINESS_ID = cfg.FINCRA_BUSINESS_ID;
        this.SAFE_HAVEN_CLIENT_ASSERTION = cfg.SAFE_HAVEN_CLIENT_ASSERTION;
        this.SAFE_HAVEN_CLIENT_ID = cfg.SAFE_HAVEN_CLIENT_ID;
        this.SAFE_HAVEN_IBS_USER_ID = cfg.SAFE_HAVEN_IBS_USER_ID;
        this.SAFE_HAVEN_IBS_CLIENT_ID = cfg.SAFE_HAVEN_IBS_CLIENT_ID;
        this.SAFE_HAVEN_REFRESH_TOKEN = cfg.SAFE_HAVEN_REFRESH_TOKEN;
        this.SAFE_HAVEN_AUTH_TOKEN = cfg.SAFE_HAVEN_AUTH_TOKEN;
        this.LOG_LEVEL = cfg.LOG_LEVEL;

        const missingKeys = [];
        Object.keys(cfg).forEach((key: keyof typeof cfg) => {
            if (cfg[key] === "" || cfg[key] === undefined || cfg[key] == null) {
                missingKeys.push(key);
            }
        });

        if (missingKeys.length) {
            const errMssg =
              "The following keys are missing from your config: \n" +
              missingKeys.join(",") +
              "\nCheck your your environment and update accordingly";
            console.error(errMssg);
            process.exit(1);
        }
    }
}

