import type { Request, Response } from "express";
import Product from "../product/product.model";
import Bid from "./bid.model";
import type IBid from "../types/bid.schema";
import { Types } from "mongoose";
import { compareObjectID, Next5Mins } from "../lib/main";

class BidController {

    static async getAllBidsForProduct(req: Request, res: Response) {
        try {
            //!TODO => check if only user can see all prod bids or anyone
            const { productID } = req.params;

            const isProductOwner = await Product.findOne({ _id: productID, owner: req.user?._id });
            if (!isProductOwner) {
                return res.status(403).json({ error: true, message: "Forbidden" });
            }

            const productBids = await Bid.find({ product: productID }).populate(["buyer", "product"]);
            if (!productBids || productBids.length == 0) return res.status(404).json({ error: true, message: "No bids found" });
            return res.status(200).json({ success: true, message: "Bids found", bids: productBids });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error fetching bids associated with that product" });
        }

    }

    static async createBid(req: Request, res: Response) {
        try {
            const { productID } = req.params;
            const { negotiating_price } = req.body;
            if (!negotiating_price) return res.status(422).json({ error: true, message: "Negotiating price required" });

            if (negotiating_price < 0) {
                return res.status(422).json({ error: true, message: "Negotiating price cannot be negative" });
            }

            const product = await Product.findById(productID);
            if (!product) return res.status(404).json({ error: true, message: "Product not found!" });
            if (!product.is_negotiable) return res.status(404).json({ error: true, message: "Product not found!" });

            // Ensure seller does not bid for their own item
            const canBidForItem = !compareObjectID(req.user?._id!, product.owner);
            if (!canBidForItem) return res.status(403).json({ error: true, message: "Cannot bid for your own item!" });

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
            const bid = await Bid.findById(bidID);
            if (!bid) return res.status(404).json({ error: true, message: "Bid not found" });

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
            const bid = await Bid.findById(bidID);
            if (!bid) return res.status(404).json({ error: true, message: "Bid not found!" });

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
            return res.status(200).json({ error: true, message: "Bid deleted successfuly" })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: true, message: "Error deleting bid" });
        }
    }
}

export default BidController;