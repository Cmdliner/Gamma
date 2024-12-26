import type { Request, Response } from "express";
import type IElectronics from "../types/electronics.schema";
import {
    allowedCategories,
    electronicsValidationSchema,
    gadgetValidationSchema,
    genericValidationSchema,
    landedPropertyValidationSchema,
    vehiclevalidationSchema,
} from "../validations/product.validation";
import Product, {
    Electronics,
    FashionProduct,
    Furniture,
    Gadget,
    LandedProperty,
    Machinery,
    OtherProduct,
    Vehicle,
} from "./product.model";
import type ILandedProperty from "../types/landed_property.schema";
import type IGadget from "../types/gadget.schema";
import type IVehicle from "../types/vehicle.schema";
import type { IFurniture } from "../types/generic.schema";
import { compareObjectID, isValidState } from "../lib/main";
import Bid from "../bid/bid.model";
import { GeospatialDataNigeria } from "../lib/location.data";
import ProductService from "./product.service";
import User from "../user/user.model";
import { ILocation } from "../types/common.type";

class ProductController {

    // Add new electronics
    static async addElectronicProduct(req: Request, res: Response) {
        try {
            const { ownership_documents, product_images } = req.processed_images;

            const humanReadableLocation = req.body.location as string;
            if (!isValidState(humanReadableLocation)) {
                return res.status(422).json({ error: true, message: "Invalid location format" });
            }

            //!TODO => Try and validate the human readable location
            const location: ILocation = {
                human_readable: humanReadableLocation,
                coordinates: [
                    GeospatialDataNigeria[humanReadableLocation].lat,
                    GeospatialDataNigeria[humanReadableLocation].long,
                ],
                type: "Point"
            };
            const electronicProductData: Partial<IElectronics> = {
                name: req.body.name,
                description: req.body.description,
                location,
                price: req.body.price,
                is_negotiable: req.body.is_negotiable,
                brand: req.body.brand,
                item_model: req.body.item_model,
                category: req.body.category,
                condition: req.body.condition,
                owner: req.user?._id,
                product_images,
            };
            if (ownership_documents.length) electronicProductData.ownership_documents = ownership_documents;

            const { error } = electronicsValidationSchema.validate(electronicProductData);
            if (error) return res.status(422).json({ error: true, message: error.details[0] });

            // check that no similar product exists in db
            const similarProdInDb = await Electronics.findOne({
                name: electronicProductData.name,
                description: electronicProductData.description,
                price: electronicProductData.price,
            });
            if (similarProdInDb) {
                return res.status(400).json({ error: true, message: "A similar product exists" });
            }

            const newElectronics = await Electronics.create(electronicProductData);
            if (!newElectronics) {
                return res.status(400).json({ error: true, message: "Error uploading product" });
            }

            return res.status(201).json({
                success: true,
                message: "Electronics uploaded successfully",
                electronics: newElectronics
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: true,
                message: "An error occured during electronics product upload"
            });
        }
    }

    // Add new landed property
    static async addLandedProperty(req: Request, res: Response) {
        try {
            const { ownership_documents, product_images } = req.processed_images;

            const humanReadableLocation = req.body.location as string;
            if (!isValidState(humanReadableLocation)) {
                return res.status(422).json({ error: true, message: "Invalid location format" });
            }

            const location: ILocation = {
                human_readable: humanReadableLocation,
                coordinates: [
                    GeospatialDataNigeria[humanReadableLocation].lat,
                    GeospatialDataNigeria[humanReadableLocation].long,
                ],
                type: "Point"
            };

            const landedPropertyData: Partial<ILandedProperty> = {
                name: req.body.name,
                description: req.body.description,
                location,
                price: req.body.price,
                is_negotiable: req.body.is_negotiable,
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
                return res.status(422).json({ error: true, message: error.details[0].message });
            }

            // CHECK THAT NO SIMILAR PROD EXISTS IN DB
            const similarProdInDb = await LandedProperty.findOne({
                name: landedPropertyData.name,
                description: landedPropertyData.description
            });
            if (similarProdInDb) {
                return res.status(400).json({ error: true, message: "A similar product exists" });
            }


            const newLandedProperty = await LandedProperty.create(landedPropertyData);
            if (!newLandedProperty) {
                return res.status(400).json({ error: true, message: "Error uploading landed property" });
            }

            return res.status(201).json({
                success: true,
                message: "Property uploaded successfully",
                landed_property: newLandedProperty
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: true,
                message: "An error occured during property upload"
            });
        }
    }

    // Add new gadget
    static async uploadGadget(req: Request, res: Response) {
        try {
            const { product_images, ownership_documents } = req.processed_images;

            const humanReadableLocation = req.body.location as string;
            if (!isValidState(humanReadableLocation)) {
                return res.status(422).json({ error: true, message: "Invalid location format" });
            }
            const location: ILocation = {
                human_readable: humanReadableLocation,
                coordinates: [
                    GeospatialDataNigeria[humanReadableLocation].lat,
                    GeospatialDataNigeria[humanReadableLocation].long,
                ],
                type: "Point"
            };


            const gadgetData: Partial<IGadget> = {
                product_images: product_images,
                name: req.body.name,
                description: req.body.description,
                owner: req.user?._id,
                location,
                price: req.body.price,
                is_negotiable: req.body.is_negotiable,
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
                return res.status(422).json({ error: true, message: error.details[0].message });
            }

            // CHECK THAT NO SIMILAR PROD EXISTS IN DB
            const similarProdInDb = await Gadget.findOne({
                name: gadgetData.name,
                description: gadgetData.description,
                price: gadgetData.price
            });
            if (similarProdInDb) {
                return res.status(400).json({ error: true, message: "A similar product exists" });
            }

            const newGadget = await Gadget.create(gadgetData);

            if (!newGadget) {
                return res.status(400).json({ error: true, message: "Error uploading gadget" });
            }

            return res.status(201).json({
                success: true,
                message: "Gadget was uploaded successfully",
                gadget: newGadget
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error uploading gadget" });
        }
    }

    // Add new vehicle
    static async uploadVehicle(req: Request, res: Response) {
        try {
            const { product_images, ownership_documents } = req.processed_images;

            const humanReadableLocation = req.body.location as string;
            if (!isValidState(humanReadableLocation)) {
                return res.status(422).json({ error: true, message: "Invalid location format" });
            }
            const location: ILocation = {
                human_readable: humanReadableLocation,
                coordinates: [
                    GeospatialDataNigeria[humanReadableLocation].lat,
                    GeospatialDataNigeria[humanReadableLocation].long,
                ],
                type: "Point"
            };

            const vehicleData: Partial<IVehicle> = {
                product_images: product_images,
                name: req.body.name,
                description: req.body.description,
                owner: req.user?._id,
                location,
                price: req.body.price,
                is_negotiable: req.body.is_negotiable,
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
                return res.status(422).json({ error: true, message: error.details[0].message });
            }

            // CHECK THAT NO SIMILAR PROD EXISTS IN DB
            const similarProdInDb = await Vehicle.findOne({
                name: vehicleData.name,
                description: vehicleData.description,
                price: vehicleData.price,
            });
            if (similarProdInDb) {
                return res.status(400).json({ error: true, message: "A similar product exists" });
            }

            const newVehicle = await Vehicle.create(vehicleData);
            if (!newVehicle) {
                return res.status(400).json({ error: true, message: "Error uploading vehicle" });
            }

            return res.status(201).json({
                success: true,
                message: "Vehicle uploaded successfully",
                vehicle: newVehicle
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error uploading vehicle" });
        }
    }

    // Add other products, furnitures, fashion products, machinery
    static async uploadGenericProduct(req: Request, res: Response) {
        try {
            const { ownership_documents, product_images } = req.processed_images;

            const humanReadableLocation = req.body.location as string;
            if (!isValidState(humanReadableLocation)) {
                return res.status(422).json({ error: true, message: "Invalid location format" });
            }
            const location: ILocation = {
                human_readable: humanReadableLocation,
                coordinates: [
                    GeospatialDataNigeria[humanReadableLocation].lat,
                    GeospatialDataNigeria[humanReadableLocation].long,
                ],
                type: "Point"
            };

            const genericProductData: Partial<IFurniture> = {
                name: req.body.name,
                description: req.body.description,
                owner: req.user?._id,
                location,
                price: req.body.price,
                is_negotiable: req.body.is_negotiable,
                condition: req.body.condition,
                category: req.body.category,
                product_images: product_images
            }

            if (ownership_documents.length) genericProductData.ownership_documents = ownership_documents;

            const { error } = genericValidationSchema.validate(genericProductData);
            if (error) {
                return res.status(422).json({ error: true, message: error.details[0].message });
            }

            // CHECK THAT NO SIMILAR PROD EXISTS IN DB
            const similarProdInDb = await Product.findOne({
                name: genericProductData.name,
                description: genericProductData.description,
                price: genericProductData.price
            });
            if (similarProdInDb) {
                return res.status(400).json({ error: true, message: "A similar product exists" });
            }

            switch (genericProductData.category) {
                case "furnitures":
                    const newFurniture = await Furniture.create(genericProductData);
                    if (!newFurniture) throw new Error("Could not create product");
                    return res.status(201).json({
                        success: true,
                        message: "Product uploaded succesfully",
                        furniture: newFurniture
                    });
                case "machineries":
                    const newMachinery = await Machinery.create(genericProductData);
                    if (!newMachinery) throw new Error("Could not create product");
                    return res.status(201).json({
                        success: true,
                        message: "Product uploaded succesfully",
                        machinery: newMachinery
                    });
                case "fashion_wears":
                    const newFashionWear = await FashionProduct.create(genericProductData);
                    if (!newFashionWear) throw new Error("Error creating product");
                    return res.status(201).json({
                        success: true,
                        message: "Product created successfully",
                        fashion_wears: newFashionWear
                    });
                case "others":
                    const otherProduct = await OtherProduct.create(genericProductData);
                    if (!otherProduct) throw new Error("Error creating product");
                    return res.status(201).json({
                        success: true,
                        message: "Product created successfully",
                        other_product: otherProduct
                    });
                default:
                    throw new Error("Invalid product category, how did you get here?");
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error uploading product" });
        }
    }

    // Get product info
    static async getProductInfo(req: Request, res: Response) {
        try {
            const { productID } = req.params;

            const product = await Product.findById(productID);
            if (!product) throw new Error("Error getting that product");
            return res.status(200).json({ success: true, message: "Product found", product });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: true,
                message: "An error occured while trying to fetch taht product!"
            });
        }
    }

    // Get all products in a single category
    static async getAllProductsInCategory(req: Request, res: Response) {
        try {
            const { productCategory } = req.params;

            const user = await User.findById(req.user?._id!);
            if (!user) {
                return res.status(404).json({ error: true, message: "User not found!" });
            }

            let page = 1;
            if (!isNaN(parseInt(req.query.page as string))) {
                page = parseInt(req.query.page as string)
            }

            let limit = 10;
            if (!isNaN(parseInt(req.query.limit as string))) {
                limit = parseInt(req.query.limit as string)
            }
            const skips = (page - 1) * limit;

            // validate product category
            const isValidCategory = allowedCategories.includes(productCategory);
            if (!isValidCategory) return res.status(400).json({ error: true, message: "Invalid product category!" });

            const productsCount = await Product.find({ category: productCategory }).countDocuments();
            const isValidPage = page <= Math.ceil(productsCount / limit);

            if (!isValidPage) {
                return res.status(404).json({ error: true, message: "Oops...Could not find that page" })
            }

            const products = await ProductService.filterAndSortByLocation(
                user.location?.coordinates,
                productCategory,
                limit,
                skips
            );
            if (products) return res.status(200).json({ success: true, message: "Products found!", products });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error fetching products" })
        }
    }

    static async deleteProductListing(req: Request, res: Response) {
        try {
            const currentUser = req.user?._id;
            const { productID } = req.params;

            const productListing = await Product.findById(productID);
            if (!productListing) return res.status(404).json({ error: true, message: "Product not found!" });

            const isAuthorizedToDelete = compareObjectID(currentUser!, productListing.owner);
            if (!isAuthorizedToDelete) return res.status(400).json({ error: true, message: "Unauthorized!" });

            // check if there are no pending operations (transactions, bids) on this item
            if (productListing.purchase_lock.is_locked) {
                return res.status(400)
                    .json({ error: true, message: "Product still has pending operations cannot delete at the moment" });
            }
            const deletedProductListing = await Product.findByIdAndDelete(productID);
            if (!deletedProductListing) throw new Error("An error occured while attempting to delete product");

            return res.status(200).json({ success: true, message: "Product listing has been deleted successfully" });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error deleting product listing" });
        }
    }

    static async getSponsoredProducts(req: Request, res: Response) {
        try {
            const { productCategory } = req.params;

            //!TODO => Filter as per user location and check category
            const now = new Date();
            const sponsoredProds = await Product.find({ category: productCategory, sponsorship: { $exists: true }, "sponsorship.expires": { $gte: now } });
            if (!sponsoredProds || !sponsoredProds.length) {
                return res.status(404).json({ error: true, message: "No sponsored products found" })
            }
            return res.status(200).json({ success: true, message: "Ads found", products: sponsoredProds });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error getting sponsored products" });
        }
    }

    static async editProduct(req: Request, res: Response) {
        const { productID } = req.params;
        const { price } = req.body;

        try {

            // FIND PRODUCT AND MAKE SURE THERE ARE NO PENDING OPERATIONS LIKE
            // TRANSACTION, BIDS ON IT TO AVOID FRAUDULENT ACTIVITY
            const product = await Product.findOne({ _id: productID });
            if (!product) {
                return res.status(404).json({ error: true, message: "Product not found" });
            }
            if (product.status !== "available") {
                return res.status(400).json({ error: true, message: "Cannot edit product!" });
            }

            // Find all pending bids and reject them
            const pendingBids = await Bid.updateMany(
                { product: product._id, status: "pending" },
                { $set: { status: "rejected" } }
            );

            // !TODO => UPDATE PRODUCT LISTING
            return res.status(200).json({ success: true, message: "Product updated successfully" });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error editing product" })
        }

    }

}

export default ProductController;