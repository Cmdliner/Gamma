import { Router } from "express";
import { UploadMiddleware, ValidateAndProcessUpload } from "../middlewares/upload.middlewares";
import ProductController from "./product.controller";

const product = Router();

product.get("/:productID",ProductController.getProductInfo);
product.get("/categories/:productCategory",ProductController.getAllProductsInCategory);
product.post("/upload-gadget", UploadMiddleware, ValidateAndProcessUpload,ProductController.uploadGadget);
product.post("/upload-vehicle", UploadMiddleware, ValidateAndProcessUpload, ProductController.uploadVehicle);
product.post("/upload-landed-property", UploadMiddleware, ValidateAndProcessUpload, ProductController.addLandedProperty);
product.post("/upload-electronics", UploadMiddleware, ValidateAndProcessUpload,ProductController.addElectronicProduct);
product.post("/upload-furniture", UploadMiddleware, ValidateAndProcessUpload, ProductController.uploadGenericProduct);
product.post("/upload-machinery", UploadMiddleware, ValidateAndProcessUpload, ProductController.uploadGenericProduct);
product.post("/upload-others", UploadMiddleware, ValidateAndProcessUpload, ProductController.uploadGenericProduct);
product.post("/upload-fashionwares", UploadMiddleware, ValidateAndProcessUpload, ProductController.uploadGenericProduct);
product.put("/:productID", ProductController.editProduct);
product.get("/:productCategory/sponsored",ProductController.getSponsoredProducts);  
product.delete("/:productID",ProductController.deleteProductListing);

export default product;