import { Router } from "express";
import ProductController from "./product.controller";
import { UploadMiddleware, ValidateUpload } from "../middlewares/upload.middlewares";

const product = Router();

product.get("/:productID", ProductController.getProductInfo);
product.get("/categories/:productCategory", ProductController.getAllProductsInCategory);
product.post("/upload-gadget", UploadMiddleware, ValidateUpload,  ProductController.uploadGadget);
product.post("/upload-vehicle", UploadMiddleware, ValidateUpload,  ProductController.uploadVehicle);
product.post("/upload-landed-property", UploadMiddleware, ValidateUpload,  ProductController.addLandedProperty);
product.post("/upload-electronics", UploadMiddleware, ValidateUpload, ProductController.addElectronicProduct);
product.post("/upload-furniture", UploadMiddleware, ValidateUpload,  ProductController.uploadGenericProduct);
product.post("/upload-machinery", UploadMiddleware, ValidateUpload,  ProductController.uploadGenericProduct);
product.post("/upload-others", UploadMiddleware, ValidateUpload,  ProductController.uploadGenericProduct);
product.post("/upload-fashionwares", UploadMiddleware, ValidateUpload,  ProductController.uploadGenericProduct);
product.post("/:productID/sponsor", ProductController.sponsorProduct);
product.get("/:productCategory/sponsored", ProductController.getSponsoredProducts);
product.delete("/:productID", ProductController.deleteProductListing);

export default product;