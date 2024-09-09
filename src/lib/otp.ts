import { randomInt } from "crypto";

export default function generateOTP() {
    return `${randomInt(9)}${randomInt(6)}${randomInt(9)}${randomInt(8)}`;
}