import express from "express";
import IUser from "./types/user.schema";

declare global {
    namespace Express {
        interface Request {
            unverified_user: { id: string, };
            user?: IUser;
        }
    }
}