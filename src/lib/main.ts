import { Types } from "mongoose"

export function compareObjectID(obj1: Types.ObjectId, obj2: Types.ObjectId) {
    return obj1.toString() === obj2.toString();
};

export const Next5Mins = () => {
    let fiveMinsInMs = (1000 * 60 * 5);
    let nowInMs = new Date().valueOf()
    return new Date(nowInMs + fiveMinsInMs);
}