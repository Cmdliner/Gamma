import { Router } from "express";
import ProductController from "./product.controller";
const product = Router();

product.get("/test", ProductController.testRoute);
product.post("/upload-gadget", ProductController.uploadGadget);
product.post("/upload-vehicle", ProductController.uploadVehicle);
product.post("/upload-furniture", ProductController.newFuriture);
product.post("/upload-machinery", ProductController.newMachinery);
product.post("/upload-electronics", ProductController.addElectronicProduct);
product.post("/upload-others", ProductController.uploadOtherProduct);
product.post("/upload-landedproperty", ProductController.addLandedProperty);
// product.get("/:productID", ProductController.getProduct)

export default product;