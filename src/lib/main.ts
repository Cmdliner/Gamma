import { Types } from "mongoose"
import crypto, { randomInt } from "crypto";

export function compareObjectID(obj1: Types.ObjectId, obj2: Types.ObjectId) {
    return obj1.toString() === obj2.toString();
};

export const Next5Mins = () => {
    let fiveMinsInMs = (1000 * 60 * 5);
    let nowInMs = new Date().valueOf()
    return new Date(nowInMs + fiveMinsInMs);
}

export const validateBankCardUsingLuhnsAlgo = (cardNo: string) => {
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

export function generateOTP() {
    return `${randomInt(9)}${randomInt(6)}${randomInt(9)}${randomInt(8)}`;
}

export const encryptBvn = (bvn: string) => {
    try {
        const IV_LENGTH = 16;

        // Base 64 encoded key gen using openssl
        const ENCRYPTION_KEY = Buffer.from(process.env.BVN_ENCRYPTION_KEY, "base64");


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

export const decryptBvn = (encryptedData: string) => {
    try {
        const ENCRYPTION_KEY = Buffer.from(process.env.BVN_ENCRYPTION_KEY, "base64");

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
