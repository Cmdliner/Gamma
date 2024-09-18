import { Router } from "express";
import ProductController from "./product.controller";
import { uploadMiddleware } from "../middlewares/upload.middlewares";

const product = Router();



product.get("/test", ProductController.testRoute);
product.post("/upload-gadget", ProductController.uploadGadget);
product.post("/upload-vehicle", ProductController.uploadVehicle);
product.post("/upload-furniture", ProductController.newFuriture);
product.post("/upload-machinery", ProductController.newMachinery);
product.post("/upload-electronics", uploadMiddleware, ProductController.addElectronicProduct);
product.post("/upload-others", ProductController.uploadOtherProduct);
product.post("/upload-landedproperty", uploadMiddleware, ProductController.addLandedProperty);
// product.get("/:productID", ProductController.getProduct)

export default product;