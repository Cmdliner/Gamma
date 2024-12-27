import Expo from "expo-server-sdk";

class NotificationService {
    private expo: Expo;
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY_MS = 5_000;
    private readonly BATCH_SIZE = 100;
    private readonly RECEIPT_CHECK_DELAY_MS = 2_000;


    /**
     *
     */
    constructor() {
        this.expo = new Expo();
    }
}

export default NotificationService;