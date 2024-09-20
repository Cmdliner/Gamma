import multer from "multer";
import path from "path";

// const prodImgPath = path.join(__dirname, "../../uploads/product_images/");
// const ownershipDocsPath = path.join(__dirname, "../../uploads/ownership_docs/");

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         if(file.fieldname == "product_images") {
//             cb(null, prodImgPath)
//         }
//         if(file.filename == "ownership_documents") {
//             cb(null, ownershipDocsPath);
//         }
//     },
//     filename: (req, file, cb) => {
//         cb(null, `${Date.now()}-${file.originalname}`);
//     }
// })
const upload = multer({ dest: "uploads/" });

export const UploadMiddleware = upload.fields([
    { name: "product_images", maxCount: 10 },
    { name: "ownership_documents", maxCount: 5 },
]);
