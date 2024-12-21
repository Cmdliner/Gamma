import type { Request, Response } from "express";
import Product from "../product/product.model";
import Bid from "./bid.model";
import type IBid from "../types/bid.schema";
import { Types } from "mongoose";
import { compareObjectID, Next5Mins } from "../lib/main";
import IProduct from "../types/product.schema";

class BidController {

    static async getAllBidsForProduct(req: Request, res: Response) {
        try {
            const { productID } = req.params;

            // CHECK IF USER IS PRODUCT OWNER
            const isProductOwner = await Product.findOne({ _id: productID, owner: req.user?._id });
            if (!isProductOwner) {
                return res.status(400).json({ error: true, message: "Forbidden" });
            }

            const productBids = await Bid.find({ product: productID }).populate(["buyer", "product"]);
            if (!productBids || !productBids.length) {
                return res.status(404).json({ error: true, message: "No bids found" });
            }

            return res.status(200).json({ success: true, message: "Bids found", bids: productBids });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error fetching bids associated with that product" });
        }

    }

    static async getAllReceivedBids(req: Request, res: Response) {
        try {
            // CHECK IF USER IS PRODUCT OWNER
            const isProductOwner = await Product.findOne({ owner: req.user?._id });
            if (!isProductOwner) {
                return res.status(400).json({ error: true, message: "Forbidden" });
            }

            const bids = await Bid.find({ status: "accepted", seller: req.user?._id }).populate("buyer");
            if (!bids || !bids.length) {
                return res.status(404).json({ error: true, message: "No bids found!" });
            }
            return res.status(200).json({ success: true, message: "Bids found", bids })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error getting deals" })
        }
    }

    static async getAllAcceptedBids(req: Request, res: Response) {
        try {

            // CHECK IF USER IS PRODUCT OWNER
            const isProductOwner = await Product.findOne({ owner: req.user?._id });
            if (!isProductOwner) {
                return res.status(400).json({ error: true, message: "Forbidden" });
            }

            const bids = await Bid.find({ seller: req.user?._id!, status: "accepted" }).populate("buyer");
        } catch (error) {

        }
    }

    static async getExpiredBids(req: Request, res: Response) {
        try {
            const bids = await Bid.find({ buyer: req.user?._id!, status: "accepted" });
            return res.status(200).json({ success: true, message: "Bids found!", bids });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error finding bids!" })
        }
    }

    static async getRejectedBids(req: Request, res: Response) {
        try {
            const bids = await Bid.find({"product.owner": req.user?._id!, status: "rejected"}).populate(["product"])
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error fetching rejected bids"})
        }
    }

    static async createBid(req: Request, res: Response) {
        try {
            const { productID } = req.params;
            const { negotiating_price } = req.body;
            if (!negotiating_price) return res.status(422).json({ error: true, message: "Negotiating price required" });

            if (negotiating_price < 0) {
                return res.status(422).json({ error: true, message: "Negotiating price must be a positive integer" });
            }

            const product = await Product.findById(productID);
            if (!product) return res.status(404).json({ error: true, message: "Product not found!" });
            if (!product.is_negotiable) return res.status(404).json({ error: true, message: "Product not found!" });

            // Ensure seller does not bid for their own item
            const canBidForItem = !compareObjectID(req.user?._id!, product.owner);
            if (!canBidForItem) return res.status(400).json({ error: true, message: "Cannot bid for your own item!" });

            const bidData: Pick<IBid, "buyer" | "negotiating_price" | "product"> = {
                buyer: req.user?._id!,
                negotiating_price,
                product: new Types.ObjectId(productID)
            };
            const bid = await Bid.create(bidData);
            if (!bid) throw new Error("Error creating bid");

            //!TODO => Send push notifications for bid creation here
            return res.status(201).json({ success: true, message: "Bid for product successful" })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error sending bid!" });
        }
    }

    // N.B => Once a bid is accepted all other bids become rejected
    static async acceptBid(req: Request, res: Response) {
        try {
            const { bidID } = req.params;
            const bid = await Bid.findById(bidID).populate("product");
            if (!bid) return res.status(404).json({ error: true, message: "Bid not found" });

            // ENSURE CURRENT USER IS PRODUCT OWNER
            const userId = req.user?._id;
            const productOwner = (bid.product as unknown as IProduct).owner;
            const isProductOwner = compareObjectID(userId, productOwner);
            if (!isProductOwner) {
                return res.status(400).json({ error: true, message: "Unauthorized!" });
            }


            bid.status = "accepted";
            bid.expires = Next5Mins();
            const rejectedBids = await Bid.updateMany({ product: bid.product }, { status: "rejected" });
            if (!rejectedBids) throw new Error("Failed to reject other bids");

            await bid.save();
            return res.status(200).json({ success: "Bid accepted successfully", bid });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "An error occured while trying to accept bid" });
        }
    }

    static async rejectBid(req: Request, res: Response) {
        try {
            const { bidID } = req.params;
            const bid = await Bid.findById(bidID).populate("product");
            if (!bid) return res.status(404).json({ error: true, message: "Bid not found!" });


            // ENSURE CURRENT USER IS PRODUCT OWNER
            const userId = req.user?._id;
            const productOwner = (bid.product as unknown as IProduct).owner;
            const isProductOwner = compareObjectID(userId, productOwner);
            if (!isProductOwner) {
                return res.status(400).json({ error: true, message: "Unauthorized!" });
            }


            bid.status = "rejected";
            await bid.save();

            return res.status(200).json({ success: true, message: "Bid rejected", bid });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Bid rejection failed" });
        }

    }

    static async deleteBid(req: Request, res: Response) {
        try {
            const { bidID } = req.params;
            const bid = await Bid.findOneAndDelete({ id: bidID, buyer: req.user?._id! });
            if (!bid) throw new Error("Could not delete that bid");
            return res.status(200).json({ success: true, message: "Bid deleted successfuly" })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error deleting bid" });
        }
    }
}

export default BidController;