import { Types } from "mongoose";

export interface INotification {
    for: Types.ObjectId;
    body: string;
    action_link?: string;
    has_been_read: boolean;
}