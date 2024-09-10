import express from "express";

declare global {
    namespace Express {
        interface Request {
            unverified_user: { id: string, };
            user?: any;
        }
    }
}