import { Router } from "express";
import ProductController from "./product.controller";
import { uploadMiddleware } from "../middlewares/upload.middlewares";

const product = Router();

product.post("/upload-gadget", uploadMiddleware, ProductController.uploadGadget);
product.post("/upload-vehicle", uploadMiddleware,  ProductController.uploadVehicle);
product.post("/upload-furniture", uploadMiddleware,  ProductController.newFurniture);
product.post("/upload-machinery", uploadMiddleware,  ProductController.newMachinery);
product.post("/upload-electronics", uploadMiddleware, ProductController.addElectronicProduct);
product.post("/upload-others", uploadMiddleware, ProductController.uploadOtherProduct);
product.post("/upload-landed-property", uploadMiddleware, ProductController.addLandedProperty);
// product.get("/:productID", ProductController.getProduct)

export default product;