import type { NextFunction, Request, Response } from "express";
import type { ReqFiles } from "../types/multer_file";
import multer from "multer";
import path from "path";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { v2 as cloudinary } from "cloudinary";
import { type UploadApiResponse } from "cloudinary";
import { cfg } from "../init";
import { StatusCodes } from "http-status-codes";

// Cloudinary configuration
cloudinary.config({
    cloud_name: cfg.CLOUDINARY_CLOUD_NAME,
    api_key: cfg.CLOUDINARY_API_KEY,
    api_secret: cfg.CLOUDINARY_SECRET
});

const MAX_FILE_SIZE = 1024 * 1024 * 10;
const MAX_WIDTH = 2000;
const MAX_HEIGHT = 2000;
const QUALITY = 80;

const isProd = cfg.NODE_ENV === "production";

const storage = multer.memoryStorage();
export const useFileFilter = (_: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith("image/")) {
        return cb(null, true);
    }
    return cb(new Error("File should be of type image!"));
}
const upload = multer({
    storage,
    fileFilter: useFileFilter,
    limits: { fileSize: MAX_FILE_SIZE }
});

export const UploadMiddleware = upload.fields([
    { name: "product_images", maxCount: 10 },
    { name: "ownership_documents", maxCount: 5 },

]);

export const UserAssetsUploadMiddleware = upload.fields([
    { name: "profile_pics", maxCount: 1 },
    { name: "verification_docs", maxCount: 10 }
])

// Process the image into high quality webp images using the sharp function
const processLocalImage = async (file: Express.Multer.File): Promise<string> => {
    const fileName = `${uuidv4()}.webp`;
    const filePath = path.join(__dirname, "../../uploads/", fileName);

    await sharp(file.buffer)
        .resize(MAX_WIDTH, MAX_HEIGHT, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(filePath);

    return filePath;
}

export const ProcessCloudinaryImage = async (file: Express.Multer.File): Promise<string> => {
    const processedImageBuffer = await sharp(file.buffer)
        .resize(MAX_WIDTH, MAX_HEIGHT, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer();

    // Upload to Cloudinary
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'oyeah/tests',
                resource_type: 'auto',
                format: 'webp'
            },
            (error: any, result: UploadApiResponse | undefined) => {
                if (error) reject(error);
                if (result) resolve(result.secure_url);
                else reject(new Error('No result from Cloudinary'));
            }
        );

        // Write the buffer to the upload stream
        uploadStream.end(processedImageBuffer);
    });
}

export const ValidateAndProcessUpload = async (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as ReqFiles;
   /*  if (!files || !files.product_images) {
        console.log("product_images is undefined in the controller");
        return res.status(400).json({ error: true, message: "product_images is required" });
    } */
    const { ownership_documents, product_images } = files;
    try {
        const processImage = isProd ? ProcessCloudinaryImage : processLocalImage;

        const processedProductImages = product_images ? await Promise.all(product_images.map(processImage)) : [];
        const processedOwnershipDocs = ownership_documents ? await Promise.all(ownership_documents.map(processImage)) : [];

        req.processed_images = {
            product_images: processedProductImages,
            ownership_documents: processedOwnershipDocs
        }
        next();
    } catch (error) {
        console.error("Error processing images:", error);
        return res.status(500).json({ error: true, message: "Error processing uploaded images" });
    }
}

export const ValidateUserUploads = async (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as ReqFiles;
    const { verification_docs, profile_pics } = files;
    try {
        if (verification_docs) {
            const processedVerificationUploads = await Promise.all(
                verification_docs.map(ProcessCloudinaryImage)
            );
            req.verification_docs = processedVerificationUploads;
        }
        if (profile_pics) {
            const processedProfilePic = await ProcessCloudinaryImage(profile_pics[0]);
            req.profile_pic = processedProfilePic;
        }
        next();
    } catch (error) {
        console.error(error);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: true, message: "Error during image upload" });
    }
}
