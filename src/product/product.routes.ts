import { Router } from "express";
import { UploadMiddleware, ValidateAndProcessUpload } from "../middlewares/upload.middlewares";
import ProductController from "./product.controller";

const product = Router();

product.get("/search", ProductController.search);
product.get("/search/:productCategory", ProductController.search);
product.get("/sponsored",ProductController.getSponsoredProducts);  
product.get("/categories/:productCategory",ProductController.getAllProductsInCategory);
product.get("/:productID", ProductController.getProductInfo);
product.post("/upload-gadget", UploadMiddleware, ValidateAndProcessUpload,ProductController.uploadGadget);
product.post("/upload-vehicle", UploadMiddleware, ValidateAndProcessUpload, ProductController.uploadVehicle);
product.post("/upload-landed-property", UploadMiddleware, ValidateAndProcessUpload, ProductController.addLandedProperty);
product.post("/upload-electronics", UploadMiddleware, ValidateAndProcessUpload,ProductController.addElectronicProduct);
product.post("/upload-furniture", UploadMiddleware, ValidateAndProcessUpload, ProductController.uploadGenericProduct);
product.post("/upload-machinery", UploadMiddleware, ValidateAndProcessUpload, ProductController.uploadGenericProduct);
product.post("/upload-others", UploadMiddleware, ValidateAndProcessUpload, ProductController.uploadGenericProduct);
product.post("/upload-fashionwears", UploadMiddleware, ValidateAndProcessUpload, ProductController.uploadGenericProduct);
product.put("/:productID", ProductController.editProduct);
product.delete("/:productID",ProductController.deleteProductListing);

export default product;