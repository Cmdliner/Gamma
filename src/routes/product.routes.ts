import { Router } from "express";
import { UploadMiddleware, ValidateAndProcessUpload } from "../middlewares/upload.middlewares";
import ProductController from "../controllers/product.controller";

const product = Router();

product.get("/search", ProductController.search);
product.get("/search/:productCategory", ProductController.search);
product.get("/sponsored",ProductController.getSponsoredProducts);  
product.get("/categories/:productCategory",ProductController.getAllProductsInCategory);
product.get("/:productID", ProductController.getProductInfo);
product.post("/repost/:productID", ProductController.repostAd);
product.post("/upload-gadget", UploadMiddleware, ValidateAndProcessUpload,ProductController.uploadGadget);
product.post("/upload-vehicle", UploadMiddleware, ValidateAndProcessUpload, ProductController.uploadVehicle);
product.post("/upload-landed-property", UploadMiddleware, ValidateAndProcessUpload, ProductController.addLandedProperty);
product.post("/upload-electronics", UploadMiddleware, ValidateAndProcessUpload,ProductController.addElectronicProduct);
product.post("/upload-furniture", UploadMiddleware, ValidateAndProcessUpload, ProductController.uploadGenericProduct);
product.post("/upload-machinery", UploadMiddleware, ValidateAndProcessUpload, ProductController.uploadGenericProduct);
product.post("/upload-others", UploadMiddleware, ValidateAndProcessUpload, ProductController.uploadGenericProduct);
product.post("/upload-fashionwears", UploadMiddleware, ValidateAndProcessUpload, ProductController.uploadGenericProduct);
product.patch("/gadgets/:productID", UploadMiddleware, ValidateAndProcessUpload,  ProductController.editUploadedGadget);
product.patch("/vehicles/:productID", UploadMiddleware, ValidateAndProcessUpload, ProductController.editUploadedVehicle);
product.patch("/landed-properties/:productID", UploadMiddleware, ValidateAndProcessUpload, ProductController.editUploadedLandedProperty);
product.patch("/electronics/:productID", UploadMiddleware, ValidateAndProcessUpload, ProductController.editUploadedElectronic);
product.patch("/furnitures/:productID", UploadMiddleware, ValidateAndProcessUpload, ProductController.editGenericProduct);
product.patch("/machineries/:productID", UploadMiddleware, ValidateAndProcessUpload, ProductController.editGenericProduct);
product.patch("/fashionables/:productID", UploadMiddleware, ValidateAndProcessUpload, ProductController.editGenericProduct);
product.patch("/others/:productID", UploadMiddleware, ValidateAndProcessUpload, ProductController.editGenericProduct);
product.delete("/:productID",ProductController.deleteProductListing);

export default product;