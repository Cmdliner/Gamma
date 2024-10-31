import { Types } from "mongoose"
import { randomInt } from "crypto";

export function compareObjectID(obj1: Types.ObjectId, obj2: Types.ObjectId) {
    return obj1.toString() === obj2.toString();
};

export const Next5Mins = () => {
    let fiveMinsInMs = (1000 * 60 * 5);
    let nowInMs = new Date().valueOf()
    return new Date(nowInMs + fiveMinsInMs);
}

export const validateBvnUsingLuhnsAlgo = (bvn: string) => {
    // Return false if bvn is not 11 digits long or an invalid number
    if (bvn.length !== 11 || isNaN(parseInt(bvn))) return false;

    // reverse the bvn
    const reversedBvn = bvn.split("").reverse().map((char: string) => parseInt(char));

    // Double every second digit and if the result >= 10 subtract 9 from it
    const doubleSecondFromRightAndHandleOverflowResult = reversedBvn.map((num: number, index: number) => {
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

    // Bvn is said to be valid if it's a multiple of 10
    return sum % 10 === 0

}

export function generateOTP() {
    return `${randomInt(9)}${randomInt(6)}${randomInt(9)}${randomInt(8)}`;
}

