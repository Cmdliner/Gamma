import { Request, Response } from "express";
import IElectronics from "../types/electronics.schema";
import { electronicsValidationSchema, gadgetValidationSchema, genericValidationSchema, landedPropertyValidationSchema, vehiclevalidationSchema } from "../validations/product.validation";
import Product, { Electronics, FashionProduct, Furniture, Gadget, LandedProperty, Machinery, OtherProduct, Vehicle } from "./product.model";
import { ReqFiles } from "../types/multer_file";
import ILandedProperty from "../types/landed_property.schema";
import IGadget from "../types/gadget.schema";
import IVehicle from "../types/vehicle.schema";
import { IFurniture } from "../types/generic.schema";

class ProductController {

    // Add new electronics
    static async addElectronicProduct(req: Request, res: Response) {
        try {
            const { ownership_documents, product_images } = req.files as ReqFiles;

            //!TODO => validate the image paths
            const ownershipDocsURL = ownership_documents ? ownership_documents.map(doc => doc.path) : [];
            const productImagesURL = product_images.map(prodImg => prodImg.path);

            const electronicProductData: Partial<IElectronics> = {
                name: req.body.name,
                description: req.body.description,
                location: req.body.location,
                price: req.body.price,
                is_biddable: req.body.is_biddable,
                brand: req.body.brand,
                item_model: req.body.item_model,
                category: req.body.category,
                condition: req.body.condition,
                owner: req.user?._id,
                product_images: productImagesURL,
                ownership_documents: ownershipDocsURL
            };

            const { error } = electronicsValidationSchema.validate(electronicProductData);
            if (error) return res.status(422).json({ error: error.details[0] });

            const newElectronics = await Electronics.create(electronicProductData);
            if (!newElectronics) {
                return res.status(400).json({ error: "Error uploading product" });
            }

            return res.status(200).json({ success: "Electronics uploaded successfully", electronics: newElectronics });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "An error occured during electronics product upload" });
        }
    }

    // Add new landed property
    static async addLandedProperty(req: Request, res: Response) {
        try {
            const { ownership_documents, product_images } = req.files as ReqFiles;

            //!TODO => validate the image paths
            const ownershipDocsURL = ownership_documents.map(doc => doc.path);
            const productImagesURL = product_images.map(prodImg => prodImg.path);

            const landedPropertyData: Partial<ILandedProperty> = {
                name: req.body.name,
                description: req.body.description,
                location: req.body.location,
                price: req.body.price,
                is_biddable: req.body.is_biddable,
                category: req.body.category,
                ownership_documents: ownershipDocsURL,
                product_images: productImagesURL,
                owner: req.user?._id,
                localty: req.body.localty,
                dimensions: req.body.dimensions,
                condition: req.body.condition
            };

            const { error } = landedPropertyValidationSchema.validate(landedPropertyData);
            if (error) {
                return res.status(422).json({ error: error.details[0].message });
            }

            const newLandedProperty = await LandedProperty.create(landedPropertyData);
            if (!newLandedProperty) {
                return res.status(400).json({ error: "Error uploading landed property" });
            }

            return res.status(201).json({ success: "Property uploaded successfully", landed_property: newLandedProperty })

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "An error occured during property upload" })
        }
    }

    // Add new gadget
    static async uploadGadget(req: Request, res: Response) {
        try {
            const { product_images, ownership_documents } = req.files as ReqFiles;

            // Get urls of uploaded images
            const productImagesURL = product_images.map(prodImg => prodImg.path);
            const ownershipDocsURLURL = ownership_documents ? ownership_documents.map(doc => doc.path) : [];

            const gadgetData: Partial<IGadget> = {
                product_images: productImagesURL,
                name: req.body.name,
                description: req.body.description,
                owner: req.user?._id,
                location: req.body.location,
                price: req.body.price,
                is_biddable: req.body.is_biddable,
                category: req.body.category,
                brand: req.body.brand,
                item_model: req.body.item_model,
                RAM: req.body.RAM,
                condition: req.body.condition
            };
            if (ownershipDocsURLURL.length > 0) gadgetData.ownership_documents = ownershipDocsURLURL;

            // validate data
            const { error } = gadgetValidationSchema.validate(gadgetData);
            if (error) {
                return res.status(422).json({ error: error.details[0].message });
            }

            const newGadget = await Gadget.create(gadgetData);
            if (!newGadget) {
                return res.status(400).json({ error: "Error uploading gadget" });
            }

            return res.status(201).json({ success: "Gadget was uploaded successfully", gadget: newGadget });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Error uploading gadget" });
        }
    }

    // Add new vehicle
    static async uploadVehicle(req: Request, res: Response) {
        try {
            const { product_images, ownership_documents } = req.files as ReqFiles;

            const productImagesURL = product_images.map(prodImg => prodImg.path);
            const ownershipDocsURL = ownership_documents ? ownership_documents.map(doc => doc.path) : [];

            const vehicleData: Partial<IVehicle> = {
                product_images: productImagesURL,
                name: req.body.name,
                description: req.body.description,
                owner: req.user?._id,
                location: req.body.location,
                price: req.body.price,
                is_biddable: req.body.is_biddable,
                category: req.body.category,
                make: req.body.make,
                is_registered: req.body.is_registered,
                item_model: req.body.item_model,
                year: req.body.year,
                condition: req.body.condition,
                vin: req.body.vin,
                transmission_type: req.body.transmission_type
            };
            if (ownershipDocsURL.length) vehicleData.ownership_documents = ownershipDocsURL;

            // Validate users vehicle data
            const { error } = vehiclevalidationSchema.validate(vehicleData);
            if (error) {
                return res.status(422).json({ error: error.details[0].message });
            }

            const newVehicle = await Vehicle.create(vehicleData);
            if (!newVehicle) {
                return res.status(400).json({ error: "Error uploading vehicle" });
            }
            return res.status(201).json({ success: "Vehicle uploaded successfully", vehicle: newVehicle });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Error uploading vehicle" })
        }
    }

    // Add other products, furnitures, fashion products, machinery
    static async uploadGenericProduct(req: Request, res: Response) {
        try {
            const { ownership_documents, product_images } = req.files as ReqFiles;
            const ownershipDocsURL = ownership_documents.map(doc => doc.path);
            const productImagesURL = product_images.map(prodImg => prodImg.path)
            const genericProductData: Partial<IFurniture> = {
                name: req.body.name,
                description: req.body.description,
                owner: req.user?._id,
                location: req.body.location,
                price: req.body.price,
                is_biddable: req.body.is_biddable,
                condition: req.body.condition,
                category: req.body.category,
                product_images: productImagesURL
            }
            if (ownership_documents.length) genericProductData.ownership_documents = ownershipDocsURL;
            const { error } = genericValidationSchema.validate(genericProductData);
            if (error) {
                return res.status(422).json({ error: error.details[0].message });
            }

            switch (genericProductData.category) {
                case "furnitures":
                    const newFurniture = await Furniture.create(genericProductData);
                    if (!newFurniture) throw new Error("Could not create product");
                    return res.status(201).json({ success: "Product uploaded succesfully", furniture: newFurniture });
                case "machineries":
                    const newMachinery = await Machinery.create(genericProductData);
                    if (!newMachinery) throw new Error("Could not create product");
                    return res.status(201).json({ success: "Product uploaded succesfully", machinery: newMachinery });
                case "fashion_wears":
                    const newFashionWear = await FashionProduct.create(genericProductData);
                    if (!newFashionWear) throw new Error("Error creating product");
                    return res.status(201).json({ success: "Product created successfully", fashion_wears: newFashionWear });
                case "others":
                    const otherProduct = await OtherProduct.create(genericProductData);
                    if (!otherProduct) throw new Error("Error creating product");
                    return res.status(201).json({ success: "Product created successfully", other_product: otherProduct });
                default:
                    throw new Error("Invalid product category, how did you get here?")
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Error uploading product" });
        }

    }

    static async getProductInfo(req: Request, res: Response) {
        try {
            const { productID } = req.params;

            const product = await Product.findById(productID);
            if (!product) throw new Error("Error getting that product");
            return res.status(200).json({ success: "Product found", product });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "An error occured while trying to fetch taht product!" });
        }
    }

    static async getAllProductsInCategory(req: Request, res: Response) {
        try {
            const { productCategory } = req.params;

            //!TODO => validate product category
    
            const products = await Product.find({ category: productCategory });
            if (!products) throw new Error("Products not found");
    
            return res.status(200).json({ success: "Products found!", products })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Error fetching products"})
        }
    }

}

export default ProductController;