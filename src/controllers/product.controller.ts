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
} from "../models/product.model";
import type ILandedProperty from "../types/landed_property.schema";
import type IGadget from "../types/gadget.schema";
import type IVehicle from "../types/vehicle.schema";
import type { IFurniture } from "../types/generic.schema";
import { compareObjectID, resolveLocation } from "../lib/utils";
import ProductService from "../services/product.service";
import User from "../models/user.model";
import IProduct from "../types/product.schema";
import { AppError } from "../lib/error.handler";
import { StatusCodes } from "http-status-codes";
import { logger } from "../config/logger.config";
import { PRODUCT_CATEGORY } from "../lib/product_category";
import { ProductCategory } from "../types/common";

class ProductController {

    static async search(req: Request, res: Response) {
        const { q, page = 1, limit = 10 } = req.query;
        const { productCategory } = req.params;
        try {
            if (!q) {
                throw new AppError(StatusCodes.BAD_REQUEST, "Query parameter 'q' is required")
            }
            const searchWords = (q as string).trim().split(/\s+/).filter(Boolean);
            if (!searchWords.length) {
                throw new AppError(StatusCodes.BAD_REQUEST, "Invalid search query");
            }

            // Build query
            let searchQuery = ProductService.buildSearchQuery(searchWords);
            const offset = (Number(page) - 1) * Number(limit);

            // Check if its product category based search
            if (productCategory) {
                const isValidCategory = allowedCategories.includes(productCategory);
                if (!isValidCategory) throw new AppError(StatusCodes.BAD_REQUEST, "Invalid product category!");

                searchQuery = ProductService.buildSearchQueryForCategories(searchWords, productCategory);
            }

            // Fetch products
            const products = await Product.find({ deleted_at: { $exists: false }, ...searchQuery })
                .limit(Number(limit))
                .skip(offset);

            // Sort products by relevance
            const sortedProducts = products
                .map((product: IProduct) => ({
                    ...product.toObject(),
                    relevanceScore: ProductService.calculateRelevanceScore(product, searchWords),
                }))
                .sort((a, b) => b.relevanceScore - a.relevanceScore)
                .map(({ relevanceScore, ...product }) => product);

            return res.status(StatusCodes.OK).json({ status: true, products: sortedProducts });

        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Internal server error");
            return res.status(status).json(errResponse);
        }
    }

    static async addElectronicProduct(req: Request, res: Response) {
        try {
            const { ownership_documents, product_images } = req.processed_images;

            const location = resolveLocation(req.body.location);
            const productData: Partial<IElectronics> = {
                name: req.body.name,
                description: req.body.description,
                location,
                price: req.body.price,
                is_negotiable: req.body.is_negotiable,
                brand: req.body.brand,
                item_model: req.body.item_model,
                category: PRODUCT_CATEGORY.ELECTRONICS as any as ProductCategory,
                condition: req.body.condition,
                owner: req.user?._id,
                product_images,
                localty: req.body.localty
            };
            if (ownership_documents.length) productData.ownership_documents = ownership_documents;

            const { error } = electronicsValidationSchema.validate(productData);
            if (error) throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, error.details[0].message);

            // check that no similar product exists in db
            const similarProdInDb = await Electronics.findOne({
                name: productData.name,
                description: productData.description,
                price: productData.price,
            });
            if (similarProdInDb) throw new AppError(StatusCodes.BAD_REQUEST, "A similar product exists");

            const newElectronics = await Electronics.create(productData);
            if (!newElectronics) throw new AppError(StatusCodes.BAD_REQUEST, "Error uploading product");

            return res.status(StatusCodes.CREATED).json({
                success: true,
                message: "Electronics uploaded successfully",
                electronics: newElectronics
            });

        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "An error occured during electronics product upload")
            return res.status(status).json(errResponse);
        }
    }

    static async addLandedProperty(req: Request, res: Response) {
        try {
            const { ownership_documents, product_images } = req.processed_images;
            const location = resolveLocation(req.body.location);

            const landedPropertyData: Partial<ILandedProperty> = {
                name: req.body.name,
                description: req.body.description,
                location,
                price: req.body.price,
                is_negotiable: req.body.is_negotiable,
                category: PRODUCT_CATEGORY.LANDED_PROPERTIES as any as ProductCategory,
                ownership_documents,
                product_images,
                owner: req.user?._id,
                localty: req.body.localty,
                dimensions: req.body.dimensions,
                condition: req.body.condition
            };

            const { error } = landedPropertyValidationSchema.validate(landedPropertyData);
            if (error) throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, error.details[0].message);

            const similarProdInDb = await LandedProperty.findOne({
                name: landedPropertyData.name,
                description: landedPropertyData.description
            });
            if (similarProdInDb) throw new AppError(StatusCodes.BAD_REQUEST, "A similar product exists");


            const newLandedProperty = await LandedProperty.create(landedPropertyData);
            if (!newLandedProperty) throw new AppError(StatusCodes.BAD_REQUEST, "Error uploading landed property");

            return res.status(StatusCodes.CREATED).json({
                success: true,
                message: "Property uploaded successfully",
                landed_property: newLandedProperty
            });

        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "An error occured during property upload");
            return res.status(status).json(errResponse);
        }
    }

    static async uploadGadget(req: Request, res: Response) {
        try {
            const { product_images, ownership_documents } = req.processed_images;
            const location = resolveLocation(req.body.location);

            const gadgetData: Partial<IGadget> = {
                product_images: product_images,
                name: req.body.name,
                description: req.body.description,
                owner: req.user?._id,
                location,
                localty: req.body.localty,
                price: req.body.price,
                is_negotiable: req.body.is_negotiable,
                category: PRODUCT_CATEGORY.GADGETS as any as ProductCategory,
                brand: req.body.brand,
                item_model: req.body.item_model,
                RAM: req.body.RAM,
                condition: req.body.condition
            };
            if (ownership_documents.length) gadgetData.ownership_documents = ownership_documents;

            // validate data
            const { error } = gadgetValidationSchema.validate(gadgetData);
            if (error) throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, error.details[0].message);

            // CHECK THAT NO SIMILAR PROD EXISTS IN DB
            const similarProdInDb = await Gadget.findOne({
                name: gadgetData.name,
                description: gadgetData.description,
                price: gadgetData.price
            });
            if (similarProdInDb) throw new AppError(StatusCodes.BAD_REQUEST, "A similar product exists");

            const newGadget = await Gadget.create(gadgetData);
            if (!newGadget) throw new AppError(StatusCodes.BAD_REQUEST, "Error uploading gadget");

            return res.status(StatusCodes.CREATED).json({
                success: true,
                message: "Gadget was uploaded successfully",
                gadget: newGadget
            });
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error uploading gadget");
            return res.status(status).json(errResponse);
        }
    }

    static async uploadVehicle(req: Request, res: Response) {
        try {
            const { product_images, ownership_documents } = req.processed_images;
            const location = resolveLocation(req.body.location);

            const vehicleData: Partial<IVehicle> = {
                product_images: product_images,
                name: req.body.name,
                description: req.body.description,
                owner: req.user?._id,
                location,
                localty: req.body.localty,
                price: req.body.price,
                is_negotiable: req.body.is_negotiable,
                category: PRODUCT_CATEGORY.VEHICLES as any as ProductCategory,
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
            if (error) throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, error.details[0].message);


            // CHECK THAT NO SIMILAR PROD EXISTS IN DB
            const similarProdInDb = await Vehicle.findOne({
                name: vehicleData.name,
                description: vehicleData.description,
                price: vehicleData.price,
            });
            if (similarProdInDb) throw new AppError(StatusCodes.BAD_REQUEST, "A similar product exists");

            const newVehicle = await Vehicle.create(vehicleData);
            if (!newVehicle) throw new AppError(StatusCodes.BAD_REQUEST, "Error uploading vehicle");

            return res.status(StatusCodes.CREATED).json({
                success: true,
                message: "Vehicle uploaded successfully",
                vehicle: newVehicle
            });
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error uploading vehicle")
            return res.status(status).json(errResponse);
        }
    }

    // Add other products, furnitures, fashion products, machinery
    static async uploadGenericProduct(req: Request, res: Response) {
        try {
            const { ownership_documents, product_images } = req.processed_images;
            const location = resolveLocation(req.body.location);

            const genericProductData: Partial<IFurniture> = {
                name: req.body.name,
                description: req.body.description,
                owner: req.user?._id,
                location,
                localty: req.body.localty,
                price: req.body.price,
                is_negotiable: req.body.is_negotiable,
                condition: req.body.condition,
                category: req.body.category,
                product_images: product_images
            }

            if (ownership_documents.length) genericProductData.ownership_documents = ownership_documents;

            const { error } = genericValidationSchema.validate(genericProductData);
            if (error) throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, error.details[0].message);

            // CHECK THAT NO SIMILAR PROD EXISTS IN DB
            const similarProdInDb = await Product.findOne({
                name: genericProductData.name,
                description: genericProductData.description,
                price: genericProductData.price
            });
            if (similarProdInDb) throw new AppError(StatusCodes.BAD_REQUEST, "A similar product exists");


            switch (genericProductData.category) {
                case "furnitures":
                    const newFurniture = await Furniture.create(genericProductData);
                    if (!newFurniture) throw new AppError(StatusCodes.BAD_REQUEST, "Could not create product");
                    return res.status(StatusCodes.CREATED).json({
                        success: true,
                        message: "Product uploaded succesfully",
                        furniture: newFurniture
                    });
                case "machineries":
                    const newMachinery = await Machinery.create(genericProductData);
                    if (!newMachinery) throw new AppError(StatusCodes.BAD_REQUEST, "Could not create product");
                    return res.status(StatusCodes.CREATED).json({
                        success: true,
                        message: "Product uploaded succesfully",
                        machinery: newMachinery
                    });
                case "fashion_wears":
                    const newFashionWear = await FashionProduct.create(genericProductData);
                    if (!newFashionWear) throw new AppError(StatusCodes.BAD_REQUEST, "Error creating product");
                    return res.status(StatusCodes.CREATED).json({
                        success: true,
                        message: "Product created successfully",
                        fashion_wears: newFashionWear
                    });
                case "others":
                    const otherProduct = await OtherProduct.create(genericProductData);
                    if (!otherProduct) throw new AppError(StatusCodes.BAD_REQUEST, "Error creating product");
                    return res.status(StatusCodes.CREATED).json({
                        success: true,
                        message: "Product created successfully",
                        other_product: otherProduct
                    });
                default:
                    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Invalid product category, how did you get here?");
            }
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error uploading product");
            return res.status(status).json(errResponse);
        }
    }

    static async getProductInfo(req: Request, res: Response) {
        try {
            const { productID } = req.params;

            const product = await Product.findById(productID);
            if (!product) throw new AppError(StatusCodes.NOT_FOUND, "Product not found!");

            return res.status(StatusCodes.OK).json({ success: true, product });
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "An error occured while trying to fetch that product");
            return res.status(status).json(errResponse);
        }
    }

    static async getAllProductsInCategory(req: Request, res: Response) {
        try {
            const { productCategory } = req.params;

            // Find the user
            const user = await User.findById(req.user?._id);
            if (!user) throw new AppError(StatusCodes.BAD_REQUEST, "User not found");

            // Default pagination values
            let page = 1;
            let limit = 10;

            // Optional: Get page and limit from query parameters
            if (!isNaN(parseInt(req.query.page as string))) page = parseInt(req.query.page as string);
            if (!isNaN(parseInt(req.query.limit as string))) limit = parseInt(req.query.limit as string);

            // Skip calculation for pagination
            const skips = (page - 1) * limit;

            // Validate product category
            const isValidCategory = allowedCategories.includes(productCategory);
            if (!isValidCategory) throw new AppError(StatusCodes.BAD_REQUEST, "Invalid product category!");

            // Get the total number of products for the category
            const productsCount = await Product.find({
                category: productCategory,
                deleted_at: { $exists: false },
            }).countDocuments();

            // Validate page number - return 404 if the page does not exist
            if (page > Math.ceil(productsCount / limit) && productsCount > 0) {
                throw new AppError(StatusCodes.NOT_FOUND, "Oops... Could not find that page");
            }

            // Fetch products for the category with pagination
            const products = await ProductService.filterAndSortByLocation(
                user.location?.coordinates,
                productCategory,
                limit,
                skips
            );

            return res.status(200).json({
                success: true,
                message: "Products found!",
                products,
                pagination: {
                    page,
                    limit,
                    totalProducts: productsCount,
                    totalPages: Math.ceil(productsCount / limit),
                },
            });
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error fetching products");
            return res.status(status).json(errResponse);
        }
    }

    static async editUploadedElectronic(req: Request, res: Response) {
        try {
            const { product_images, ownership_documents } = req.processed_images;
            const { productID } = req.params;

            const electronic = await Electronics.findOne({ _id: productID, deleted_at: { $exists: false } });
            if (!electronic) throw new AppError(StatusCodes.NOT_FOUND, "Electronic upload not found!");

            const canEdit = compareObjectID(req.user?._id, electronic.owner);
            if (!canEdit) throw new AppError(StatusCodes.NOT_FOUND, "Electronic upload not found!");

            const isProdAvailable = electronic.status === "available";
            if (!isProdAvailable) throw new AppError(StatusCodes.LOCKED, "Product is unavailable for editting!");

            const productData: Partial<IElectronics> = {};
            if (req.body.name) productData.name = req.body.name;
            if (req.body.description) productData.description = req.body.description;
            if (req.body.location) productData.location = resolveLocation(req.body.location);
            if (req.body.localty) productData.localty = req.body.localty;
            if (req.body.brand) productData.brand = req.body.brand;
            if (req.body.price) productData.price = req.body.price;
            if (req.body.is_negotiable) productData.is_negotiable = req.body.is_negotiable;
            if (req.body.item_model) productData.item_model = req.body.item_model;
            if (req.body.condition) productData.condition = req.body.condition;
            if (ownership_documents?.length) productData.ownership_documents = ownership_documents;
            if (product_images?.length) productData.product_images = product_images;

            // !todo => Validate data

            await Electronics.findByIdAndUpdate(electronic._id, productData);
            return res.status(StatusCodes.OK).json({ success: true, message: "Item update successful" });

        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error updating item");
            return res.status(status).json(errResponse);
        }
    }

    static async editUploadedGadget(req: Request, res: Response) {
        try {
            const { product_images, ownership_documents } = req.processed_images;
            const { productID } = req.params;

            const gadget = await Gadget.findOne({ _id: productID, deleted_at: { $exists: false } });;
            if (!gadget) throw new AppError(StatusCodes.NOT_FOUND, "Gadget upload not found!");

            const canEdit = compareObjectID(req.user?._id, gadget.owner);
            if (!canEdit) throw new AppError(StatusCodes.NOT_FOUND, "Gadget upload not found!");

            const isProdAvailable = gadget.status === "available";
            if (!isProdAvailable) throw new AppError(StatusCodes.LOCKED, "Product is unavailable for editting!");

            const gadgetData: Partial<IGadget> = {};
            if (req.body.name) gadgetData.name = req.body.name;
            if (req.body.description) gadgetData.description = req.body.description;
            if (req.body.location) gadgetData.location = resolveLocation(req.body.location);
            if (req.body.localty) gadgetData.localty = req.body.localty;
            if (req.body.price) gadgetData.price = req.body.price;
            if (req.body.is_negotiable) gadgetData.is_negotiable = req.body.is_negotiable;
            if (req.body.brand) gadgetData.brand = req.body.brand;
            if (req.body.RAM) gadgetData.RAM = req.body.RAM;
            if (req.body.condition) gadgetData.condition = req.body.condition;

            if (product_images?.length) gadgetData.product_images = product_images;
            if (ownership_documents?.length) gadgetData.ownership_documents = ownership_documents;

            // !todo => Validate the user data

            await Gadget.findByIdAndUpdate(productID, gadgetData);

            return res.status(StatusCodes.OK).json({ success: true, message: "Item update successful" });


        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error updating item");
            return res.status(status).json(errResponse);
        }
    }

    static async editUploadedVehicle(req: Request, res: Response) {
        try {
            const { ownership_documents, product_images } = req.processed_images;
            const { productID } = req.params;

            const vehicle = await Vehicle.findOne({ _id: productID, deleted_at: { $exists: false } });
            if (!vehicle) throw new AppError(StatusCodes.NOT_FOUND, "Vehicle upload not found!");

            const canEdit = compareObjectID(req.user?._id, vehicle.owner);
            if (!canEdit) throw new AppError(StatusCodes.NOT_FOUND, "Vehicle upload not found!");

            const isProdAvailable = vehicle.status === "available";
            if (!isProdAvailable) throw new AppError(StatusCodes.LOCKED, "Product is unavailable for editting!");

            const vehicleUpdateData: Partial<IVehicle> = {};

            if (req.body.name) vehicleUpdateData.name = req.body.name;
            if (req.body.description) vehicleUpdateData.description = req.body.description;
            if (req.body.location) vehicleUpdateData.location = resolveLocation(req.body.location);
            if (req.body.localty) vehicleUpdateData.localty = req.body.location;
            if (req.body.price) vehicleUpdateData.price = req.body.price;
            if (req.body.is_negotiable) vehicleUpdateData.is_negotiable = req.body.is_negotiable;
            if (req.body.make) vehicleUpdateData.make = req.body.make;
            if (req.body.is_registered) vehicleUpdateData.is_registered = req.body.is_registered;
            if (req.body.item_model) vehicleUpdateData.item_model = req.body.item_model;
            if (req.body.year) vehicleUpdateData.year = req.body.year;
            if (req.body.condition) vehicleUpdateData.condition = req.body.condition;
            if (req.body.vin) vehicleUpdateData.vin = req.body.vin;
            if (req.body.transmission_type) vehicleUpdateData.transmission_type;
            if (product_images?.length) vehicleUpdateData.product_images = product_images;
            if (ownership_documents?.length) vehicleUpdateData.ownership_documents = ownership_documents;

            // ! todo => Validate data

            await Vehicle.findByIdAndUpdate(vehicle._id, vehicleUpdateData);
            return res.status(StatusCodes.OK).json({ success: true, message: "Item update successful" });

        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error updating item");
            return res.status(status).json(errResponse);
        }
    }

    static async editUploadedLandedProperty(req: Request, res: Response) {
        try {
            const { ownership_documents, product_images } = req.processed_images;
            const { productID } = req.params;

            const landedProperty = await LandedProperty.findOne({ _id: productID, deleted_at: { $exists: false } });
            if (!landedProperty) throw new AppError(StatusCodes.NOT_FOUND, "Landed property upload not found!");

            const canEdit = compareObjectID(req.user?._id, landedProperty.owner);
            if (!canEdit) throw new AppError(StatusCodes.NOT_FOUND, "Landed property upload not found!");

            const isProdAvailable = landedProperty.status === "available";
            if (!isProdAvailable) throw new AppError(StatusCodes.LOCKED, "Product is unavailable for editting!");

            const landUpdateData: Partial<ILandedProperty> = {};
            if (req.body.name) landUpdateData.name = req.body.name;
            if (req.body.description) landUpdateData.description = req.body.description;
            if (req.body.location) landUpdateData.location = resolveLocation(req.body.location);
            if (req.body.price) landUpdateData.price = req.body.price;
            if (req.body.is_negotiable) landUpdateData.is_negotiable = req.body.is_negotiable;
            if (req.body.localty) landUpdateData.localty = req.body.localty;
            if (req.body.dimensions) landUpdateData.dimensions = req.body.dimensions;
            if (req.body.condition) landUpdateData.condition = req.body.condition;
            if (product_images?.length) landUpdateData.product_images = product_images;
            if (ownership_documents?.length) landUpdateData.ownership_documents = ownership_documents;

            // !todo => validate data

            await LandedProperty.findByIdAndUpdate(landedProperty._id, landUpdateData);
            return res.status(StatusCodes.OK).json({ success: true, message: "Item upload successful" });
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error updating item");
            return res.status(status).json(errResponse);
        }
    }

    // Edit furnitures, fashion products, machinery and other products
    static async editGenericProduct(req: Request, res: Response) {
        try {
            const { ownership_documents, product_images } = req.processed_images;
            const { productID } = req.params;

            if (!req.body.category) throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, "category required!");

            const isValidCategory = allowedCategories.includes(req.body.category);
            if (!isValidCategory) throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, "Invalid category!");

            const genericProduct = await Product.findOne({ _id: productID, deleted_at: { $exists: false } });
            if (!genericProduct) throw new AppError(StatusCodes.NOT_FOUND, "Product upload not found!");

            const canEdit = compareObjectID(req.user?._id, genericProduct.owner);
            if (!canEdit) throw new AppError(StatusCodes.NOT_FOUND, "Product upload not found!");

            const isProdAvailable = genericProduct.status === "available";
            if (!isProdAvailable) throw new AppError(StatusCodes.LOCKED, "Product is unavailable for editting!");

            const genericProdUpdateData: Partial<IFurniture> = {};
            if (req.body.name) genericProdUpdateData.name = req.body.name;
            if (req.body.description) genericProdUpdateData.description = req.body.description;
            if (req.body.location) genericProdUpdateData.location = resolveLocation(req.body.location);
            if (req.body.localty) genericProdUpdateData.localty = req.body.localty;
            if (req.body.price) genericProdUpdateData.price = req.body.price;
            if (req.body.is_negotiable) genericProdUpdateData.is_negotiable = req.body.is_negotiable;
            if (req.body.condition) genericProdUpdateData.condition = req.body.condition;
            if (product_images?.length) genericProdUpdateData.product_images = product_images;
            if (ownership_documents?.length) genericProdUpdateData.ownership_documents = ownership_documents;

            switch (req.body.category) {
                case "furnitures":
                    await Furniture.findByIdAndUpdate(genericProduct._id, genericProdUpdateData);
                    break;
                case "machineries":
                    await Machinery.findByIdAndUpdate(genericProduct._id, genericProdUpdateData);
                    break;
                case "fashion_wears":
                    await FashionProduct.findByIdAndUpdate(genericProduct._id, genericProdUpdateData);
                    break;
                case "others":
                    await OtherProduct.findByIdAndUpdate(genericProduct._id, genericProdUpdateData);
                    break;
            }
            return res.status(StatusCodes.OK).json({ success: true, message: "Item upload successful" });

        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error updating item");
            return res.status(status).json(errResponse);
        }
    }

    static async deleteProductListing(req: Request, res: Response) {
        try {
            const currentUser = req.user?._id;
            const { productID } = req.params;

            const productListing = await Product.findById(productID);
            console.log({ productListing });
            if (!productListing) throw new AppError(StatusCodes.NOT_FOUND, "Product not found!");

            const isAuthorizedToDelete = compareObjectID(currentUser, productListing.owner);
            if (!isAuthorizedToDelete) throw new AppError(StatusCodes.NOT_FOUND, "Product not found!");

            // check if there are no pending operations (transactions, bids) on this item
            if (productListing.purchase_lock.is_locked) {
                throw new AppError(StatusCodes.LOCKED, "Product still has pending operations. Cannot delete at the moment");
            }
            await Product.findByIdAndUpdate(productID, { deleted_at: new Date() });

            return res.status(StatusCodes.NO_CONTENT).json();

        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error deleting product listing");
            return res.status(status).json(errResponse);
        }
    }

    static async getSponsoredProducts(req: Request, res: Response) {
        try {
            const { status }: { status: string } = req.query as any;

            const validAdStatuses = ["under_review", "active"];
            const isValidAdStatus = validAdStatuses.includes(status)
            if (!isValidAdStatus) throw new AppError(StatusCodes.BAD_REQUEST, "Invalid status");

            const now = new Date();
            const sponsoredProds = await Product.find({
                deleted_at: { $exists: false },
                sponsorship: { $exists: true },
                owner: req.user?._id,
                "sponsorship.expires": { $gte: now },
                "sponsorship.status": status
            });

            return res.status(StatusCodes.OK).json({ success: true, message: "Ads found", products: sponsoredProds });
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error getting sponsored products");
            return res.status(status).json(errResponse);
        }
    }

}

export default ProductController;
