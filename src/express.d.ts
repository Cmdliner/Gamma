import express from "express";
import IUser from "./types/user.schema";
import { ReqFiles } from "./types/multer_file";

declare global {
    namespace Express {
        interface Request {
            unverified_user: { id: string, };
            processed_images: {
                product_images: string[],
                ownership_documents: string[]
            };
            verification_docs: string[];
            profile_pic: string;
            user?: IUser;
        }
    }
}