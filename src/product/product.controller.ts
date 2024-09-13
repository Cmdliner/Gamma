import { Request, Response } from "express";

class ProductController {

    // Add new electronics
    static async addElectronicProduct() {}

    // Add new landed property
    static async addLandedProperty() {}

    // Add new gadget
    static async uploadGadget() {}

    // Add new vehicle
    static async uploadVehicle() {}

    // Add new furniture 
    static async newFuriture() {}

    // Add new machinery
    static async newMachinery() {}

    // Add fashion wear
    static async uploadFashionProduct() {}

    // Add other products
    static async uploadOtherProduct() {
    }
    // Test products endpoint
    static async testRoute(req: Request, res: Response) {
        return res.status(200).json({"a": "test product routes"});
    }

}

export default ProductController;