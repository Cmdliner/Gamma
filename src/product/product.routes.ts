import { Router } from "express";

const product = Router();


product.post("/upload-gadget", ProductController.uploadGadget);
product.post("/upload-vehicle", ProductController.uploadVehicle);
product.post("/upoad-furniture", ProductController.newFuriture);
product.post("/upload-machinery", ProductController.newMachinery);
product.post("/upload-electronics", ProductController.addElectronicProduct);
product.post("/upload-others", ProductController.uploadOtherProduct);
product.post("/upload-landedproperty", ProductController.addLandedProperty);