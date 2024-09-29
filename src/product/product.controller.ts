import type { Request, Response } from "express";
import type IElectronics from "../types/electronics.schema";
import { allowedCategories, electronicsValidationSchema, gadgetValidationSchema, genericValidationSchema, landedPropertyValidationSchema, vehiclevalidationSchema } from "../validations/product.validation";
import Product, { Electronics, FashionProduct, Furniture, Gadget, LandedProperty, Machinery, OtherProduct, Vehicle } from "./product.model";
import type ILandedProperty from "../types/landed_property.schema";
import type IGadget from "../types/gadget.schema";
import type IVehicle from "../types/vehicle.schema";
import type { IFurniture } from "../types/generic.schema";
import { compareObjectID } from "../lib/main";


class ProductController {

    // Add new electronics
    static async addElectronicProduct(req: Request, res: Response) {
        try {
            const { ownership_documents, product_images } = req.processed_images;

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
                product_images,
            };
            if (ownership_documents.length) electronicProductData.ownership_documents = ownership_documents;

            const { error } = electronicsValidationSchema.validate(electronicProductData);
            if (error) return res.status(422).json({ error: error.details[0] });

            const newElectronics = await Electronics.create(electronicProductData);
            if (!newElectronics) {
                return res.status(400).json({ error: "Error uploading product" });
            }

            return res.status(201).json({ success: "Electronics uploaded successfully", electronics: newElectronics });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "An error occured during electronics product upload" });
        }
    }

    // Add new landed property
    static async addLandedProperty(req: Request, res: Response) {
        try {
            const { ownership_documents, product_images } = req.processed_images;

            const landedPropertyData: Partial<ILandedProperty> = {
                name: req.body.name,
                description: req.body.description,
                location: req.body.location,
                price: req.body.price,
                is_biddable: req.body.is_biddable,
                category: req.body.category,
                ownership_documents,
                product_images,
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
            const { product_images, ownership_documents } = req.processed_images;


            const gadgetData: Partial<IGadget> = {
                product_images: product_images,
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
            if (ownership_documents.length) gadgetData.ownership_documents = ownership_documents;

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
            const { product_images, ownership_documents } = req.processed_images;

            const vehicleData: Partial<IVehicle> = {
                product_images: product_images,
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
            if (ownership_documents.length) vehicleData.ownership_documents = ownership_documents;

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
            const { ownership_documents, product_images } = req.processed_images;
            const genericProductData: Partial<IFurniture> = {
                name: req.body.name,
                description: req.body.description,
                owner: req.user?._id,
                location: req.body.location,
                price: req.body.price,
                is_biddable: req.body.is_biddable,
                condition: req.body.condition,
                category: req.body.category,
                product_images: product_images
            }
            if (ownership_documents.length) genericProductData.ownership_documents = ownership_documents;
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

    // Get product info
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

    // Get all products in a single category
    static async getAllProductsInCategory(req: Request, res: Response) {
        try {
            const { productCategory } = req.params;

            //!TODO => validate product category
            const isValidCategory = allowedCategories.includes(productCategory);
            if (!isValidCategory) return res.status(400).json({ error: "Invalid product category!" });

            const products = await Product.find({ category: productCategory });
            if (products) return res.status(200).json({ success: "Products found!", products });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Error fetching products" })
        }
    }

    static async deleteProductListing(req: Request, res: Response) {
        try {
            const currentUser = req.user?._id;
            const { productID } = req.params;

            const productListing = await Product.findById(productID);
            if (!productListing) return res.status(404).json({ error: "Product not found!" });

            const isAuthorizedToDelete = compareObjectID(currentUser!, productListing.owner);
            if (!isAuthorizedToDelete) return res.status(403).json({ error: "Unauthorized!" });

            //!TODO => check if there are no pending operations (transactions, bids) on this item
            const deletedProductListing = await Product.findByIdAndDelete(productID);
            if (!deletedProductListing) throw new Error("An error occured while attempting to delete product");

            return res.status(200).json({ success: "Product listing has been deleted successfully" });

        } catch (error) {

        }
    }

    static async sponsorProduct(req: Request, res: Response) {
        const { productID } = req.params;
        //!TODO => Ensure product exists && only owner can sponsor it
        // use transaction service and db transactions to make payment for sponsorhsip
        // then set the sponsored flag to true so it can be fetched into the market place sponsored section
    }

    static async getSponsoredProducts(req: Request, res: Response) {
        try {
            const { categoryName } = req.params;

            //!TODO => Filter as per user location
            const sponsoredProds = await Product.find({ category: categoryName, sponsored: true });
            return res.status(200).json({ success: "Ads found", products: sponsoredProds });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Error getting sponsored products" });
        }
    }

}

export default ProductController;