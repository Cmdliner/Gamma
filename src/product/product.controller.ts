import { Request, Response } from "express";
import { TElectronicsUploadBody } from "../types/product.dto";
import IElectronics from "../types/electronics.schema";
import { electronicsValidationSchema } from "../validations/product.validation";

class ProductController {

    // Add new electronics
    static async addElectronicProduct(req: Request, res: Response) {
        try {
            const uploadFields= req.files;
            console.log(`Fields: ${uploadFields?.keys}`);
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
            const electronicProductData: Partial<IElectronics> = { name, description, location, price, is_biddable, brand, item_model, category, condition };
            const { error } = electronicsValidationSchema.validate(electronicProductData);
            if (error) {
                return res.status(422).json({ error: error.details[0] });
            }


        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "An error occured during electronics product upload" })
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