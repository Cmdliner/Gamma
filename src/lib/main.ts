import { Types } from "mongoose"

export function compareObjectID(obj1: Types.ObjectId, obj2: Types.ObjectId) {
    return obj1.toString() === obj2.toString();
};