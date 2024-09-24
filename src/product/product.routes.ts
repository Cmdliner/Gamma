import { Router } from "express";
import ProductController from "./product.controller";
import { UploadMiddleware } from "../middlewares/upload.middlewares";

const product = Router();

product.get("/:productID", ProductController.getProductInfo);
product.get("/categories/:productCategory", ProductController.getAllProductsInCategory);
product.post("/upload-gadget", UploadMiddleware, ProductController.uploadGadget);
product.post("/upload-vehicle", UploadMiddleware, ProductController.uploadVehicle);
product.post("/upload-landed-property", UploadMiddleware, ProductController.addLandedProperty);
product.post("/upload-electronics", UploadMiddleware, ProductController.addElectronicProduct);
product.post("/upload-furniture", UploadMiddleware, ProductController.uploadGenericProduct);
product.post("/upload-machinery", UploadMiddleware, ProductController.uploadGenericProduct);
product.post("/upload-others", UploadMiddleware, ProductController.uploadGenericProduct);
product.post("/upload-fashionwares", UploadMiddleware, ProductController.uploadGenericProduct);
product.post("/:productID/sponsor", ProductController.sponsorProduct);
product.get("/:productCategory/sponsored", ProductController.getSponsoredProducts);
product.delete("/:productID", ProductController.deleteProductListing);

export default product;