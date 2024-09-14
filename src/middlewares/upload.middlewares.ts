import { NextFunction, Request, Response } from "express";
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    destination: path.resolve(__dirname, "../../uploads/products/"),
    // filename
})

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if(file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only images allowed!"));
    }
};


const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter
})



export const uploadMiddleware = upload.fields(
    [
        {
            name: "product_images", maxCount: 10
        }, 
        {
            name: "ownership_documents", maxCount: 5
        }
    ]
);

export const validateUploads = (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files.ownership_documents || files.ownership_documents.length === 0 || !files.product_images || files.product_images.length === 0) {
        console.log(files);
      return res.status(400).json({ error: 'At least one ownership document and one product image are required' });
    }
  
    if (files.ownership_documents.length > 10 || files.product_images.length > 10) {
      return res.status(400).json({ error: 'Maximum of 10 ownership_documents and 10 product images allowed' });
    }
    next();
  };