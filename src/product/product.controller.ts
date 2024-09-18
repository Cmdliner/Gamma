import { Request, Response } from "express";
import { TElectronicsUploadBody } from "../types/product.dto";
import IElectronics from "../types/electronics.schema";
import { electronicsValidationSchema } from "../validations/product.validation";
import { Electronics } from "./product.model";

class ProductController {

    // Add new electronics
    static async addElectronicProduct(req: Request, res: Response) {
        try {
            const { ownership_documents, product_images } = req.files as { [fieldname: string]: Express.Multer.File[] };
            
            console.log(req.files);
            //!TODO => validate the image paths
            const ownershipDocumentsURL = ownership_documents.map(doc => doc.path);
            console.log("OwnershipDosURL", ownershipDocumentsURL);
            const productImagesURL = product_images.map(prodImg => prodImg.path);
            console.log("Prod images url", productImagesURL);


            const {
                name,
                description,
                location,
                price,
                is_biddable,
                brand,
                item_model,
                condition,
                category
            }: TElectronicsUploadBody = req.body;
            const electronicProductData: Partial<IElectronics> = {
                name,
                description,
                location,
                price,
                is_biddable,
                brand,
                item_model,
                category,
                condition,
            };
            electronicProductData.owner = req.user?._id;
            electronicProductData.product_images = productImagesURL;
            electronicProductData.ownership_documents = ownershipDocumentsURL;

            const { error } = electronicsValidationSchema.validate(electronicProductData);
            if (error) return res.status(422).json({ error: error.details[0] });

            const newElectronics = new Electronics(electronicProductData);
            if (!newElectronics) return res.status(400).json({ error: "Error uploading electronics product" });

            await newElectronics.save();
            return res.status(200).json({ success: "Electronics uploaded successfully", electronics: newElectronics });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "An error occured during electronics product upload" });
        }
    }

    // Add new landed property
    static async addLandedProperty(req: Request, res: Response) {
        try {
            throw new Error("Not Implementes")
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "An error occured while upload proeprty" })
        }
    }

    // Add new gadget
    static async uploadGadget() { }

    // Add new vehicle
    static async uploadVehicle() { }

    // Add new furniture 
    static async newFuriture() { }

    // Add new machinery
    static async newMachinery() { }

    // Add fashion wear
    static async uploadFashionProduct() { }

    // Add other products
    static async uploadOtherProduct() {
    }
    // Test products endpoint
    static async testRoute(req: Request, res: Response) {
        return res.status(200).json({ "a": "test product routes" });
    }

}

export default ProductController;