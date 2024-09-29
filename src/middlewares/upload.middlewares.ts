import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ReqFiles } from "../types/multer_file";
import path from "path";


const FiveMB = 1024 * 1024 * 5;
const storage = multer.diskStorage({destination: path.join(__dirname, "../../uploads/")})
const upload = multer({ storage });

export const UploadMiddleware = upload.fields([
    { name: "product_images", maxCount: 10 },
    { name: "ownership_documents", maxCount: 5 },

]);

export const ValidateUpload = (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as ReqFiles;
  
    if (!files || !files.product_images) {
      console.log("product_images is undefined in the controller");
      return res.status(400).json({ error: "product_images is required" });
    }
    const { ownership_documents, product_images } = files;

    const ownershipDocsURL = ownership_documents ? ownership_documents.map(doc => doc.path) : [];
    const productImagesURL = product_images.map(prodImg => prodImg.path);
  
    console.log("ownershipDocsURL:", ownershipDocsURL);
    console.log("productImagesURL:", productImagesURL);

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
