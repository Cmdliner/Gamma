import { Types } from "mongoose"
import crypto, { randomInt } from "crypto";
import { GeospatialDataNigeria } from "./location.data";
import { cfg } from "../init";
import { type Request, type Response, type NextFunction } from "express";
import { Options } from "express-rate-limit";

export function compareObjectID(obj1: Types.ObjectId, obj2: Types.ObjectId): boolean {
    return obj1.toString() === obj2.toString();
};

export const Next5Mins = (): Date => {
    let fiveMinsInMs = (1000 * 60 * 5);
    let nowInMs = new Date().valueOf()
    return new Date(nowInMs + fiveMinsInMs);
}

/**
 * @deprecated
 */
export const validateBankCardUsingLuhnsAlgo = (cardNo: string): boolean => {
    // Return false if cardNo is not 11 digits long or an invalid number
    if (cardNo.length !== 11 || isNaN(parseInt(cardNo))) return false;

    // reverse the cardNo
    const reversedCardNo = cardNo.split("").reverse().map((char: string) => parseInt(char));

    // Double every second digit and if the result >= 10 subtract 9 from it
    const doubleSecondFromRightAndHandleOverflowResult = reversedCardNo.map((num: number, index: number) => {
        if (index % 2 == 1) {
            let doubledNum = (num * 2);

            doubledNum = doubledNum >= 10 ? doubledNum - 9 : doubledNum;
            return doubledNum;
        }
        return num;
    });

    // Add all the digits from the array into one
    const sum = doubleSecondFromRightAndHandleOverflowResult.reduce(
        (current: number, acc: number, index: number, arr: number[]) => {
            return (acc += current);
        },
        0
    );

    // cardNo is said to be valid if it's a multiple of 10
    return sum % 10 === 0
}

export function generateOTP(): string {
    return `${randomInt(9)}${randomInt(6)}${randomInt(9)}${randomInt(8)}`;
}

export const hashBvn = (bvn: string) => {
    return crypto.createHash("sha256").update(bvn).digest("hex");
}

export const encryptBvn = (bvn: string): string => {
    try {
        const IV_LENGTH = 16;

        // Base 64 encoded key gen using openssl
        const ENCRYPTION_KEY = Buffer.from(cfg.BVN_ENCRYPTION_KEY, "base64");


        // Create a 16 bit init vector (think of this like a unique salt)
        const iv = crypto.randomBytes(IV_LENGTH);

        // Create cipher using encryption key and iv
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);

        // encrypt the bvn payload 
        let encrypted = cipher.update(bvn, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
        throw new Error(`Failed to encrypt bvn ${(error as Error).message}`);

    }
}

export const decryptBvn = (encryptedData: string): string => {
    try {
        const ENCRYPTION_KEY = Buffer.from(cfg.BVN_ENCRYPTION_KEY, "base64");

        const [ivString, encryptedBvnString] = encryptedData.split(":");

        const iv = Buffer.from(ivString, 'hex');
        const encrypted = Buffer.from(encryptedBvnString, 'hex');

        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);

        let decrypted = decipher.update(encrypted).toString('utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        throw new Error(`Failed to decrypt bvn ${(error as Error).message}`);
    }

}

export function matchAccNameInDb(
    db_first_name: string,
    db_last_name: string,
    db_middle_name: string | null,
    external_account_name: string
): boolean {
    // Helper: Normalize and split a name into an array of words
    const normalize_name = (name: string) => name.toLowerCase().trim();
    const account_name_parts = external_account_name.split(" ").map(normalize_name);

    // Normalize database names
    const normalized_first_name = normalize_name(db_first_name);
    const normalized_last_name = normalize_name(db_last_name);
    const normalized_middle_name = db_middle_name ? normalize_name(db_middle_name) : null;

    // Find positions of the first and last names in the account name parts
    const first_name_index = account_name_parts.indexOf(normalized_first_name);
    const last_name_index = account_name_parts.indexOf(normalized_last_name);

    // Validate that first and last names exist and are in distinct positions
    if (first_name_index === -1 || last_name_index === -1 || first_name_index === last_name_index) {
        return false;
    }

    // If middle name is provided, validate it does not overlap with first or last names
    if (normalized_middle_name && account_name_parts.includes(normalized_middle_name)) {
        const middle_name_index = account_name_parts.indexOf(normalized_middle_name);
        if (middle_name_index === first_name_index || middle_name_index === last_name_index) {
            return false;
        }
    }

    return true; // All validations passed
}

export function rateLimitMiddlewareHandler(_req: Request, res: Response, next: NextFunction, _: Options) {
    res.status(429).json({ error: true, message: "Too many requests" });
    next();
}

export const isValidState = (state: string) => GeospatialDataNigeria[state] ? true : false;