import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ReqFiles } from "../types/multer_file";


const FiveMB = 1024 * 1024 * 5;

const upload = multer({ dest: "uploads/" });

export const UploadMiddleware = upload.fields([
    { name: "product_images", maxCount: 10 },
    { name: "ownership_documents", maxCount: 5 },
]);

export const validateUpload = (req: Request, res: Response, next: NextFunction) => {
    const { product_images, ownership_documents } = req.files as ReqFiles;

    const prodImagesAreImages = product_images.every((prodImg) => {
        return prodImg.mimetype.startsWith("image/");
    });
    const ownershipDocsAreImages = ownership_documents.every((doc) => {
        return doc.mimetype.startsWith("image/");
    });

    const prodImagesDoNotExceedMaxFileSize = product_images.every((prodImg) => {
        return prodImg.size < FiveMB;
    });
    const ownershipDocsDoNotExceedMaxFileSize = ownership_documents.every((doc) => {
        return doc.size < FiveMB;
    });

    if (!prodImagesAreImages || !ownershipDocsAreImages) {
        return res.status(422).json({ error: "Upload files must be valid images" })
    }
    if (!prodImagesDoNotExceedMaxFileSize || !ownershipDocsDoNotExceedMaxFileSize) {
        return res.status(422).json({ error: "Individual image files cannot be greater than 5MB" });
    }
    next();
}
