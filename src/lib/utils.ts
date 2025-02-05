import { Types } from "mongoose"
import crypto, { randomInt } from "crypto";
import { GeospatialDataNigeria } from "./location.data";
import { cfg } from "../init";
import { type Request, type Response, type NextFunction } from "express";
import { Options } from "express-rate-limit";
import { AppError } from "./error.handler";
import { StatusCodes } from "http-status-codes";

export function compareObjectID(obj1: Types.ObjectId, obj2: Types.ObjectId): boolean {
    return obj1.toString() === obj2.toString();
};

export const Next5Mins = (): Date => {
    let fiveMinsInMs = (1000 * 60 * 5);
    let nowInMs = new Date().valueOf()
    return new Date(nowInMs + fiveMinsInMs);
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

export function rateLimitMiddlewareHandler(_req: Request, res: Response, _next: NextFunction, _: Options) {
    return res.status(429).json({ error: true, message: "Too many requests" });
}

type LocationType = { type: "Point", human_readable: string, coordinates: [number, number] };

export  function resolveLocation(location: string): LocationType {

    const humanReadableLocation = location;

    if (!isValidState(humanReadableLocation)) {
        throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, "Invalid location format");
    }

    return {
        type: "Point",
        human_readable: humanReadableLocation,
        coordinates: [
            GeospatialDataNigeria[humanReadableLocation].lat,
            GeospatialDataNigeria[humanReadableLocation].long
        ]
    };
}

export const isValidState = (state: string) => GeospatialDataNigeria[state] ? true : false;