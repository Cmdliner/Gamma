import type { Request, Response } from "express";
import Product from "../models/product.model";
import Bid from "../models/bid.model";
import { startSession, Types } from "mongoose";
import { compareObjectID, Next5Mins } from "../lib/utils";
import { logger } from "../config/logger.config";
import { AppError } from "../lib/error.handler";
import { StatusCodes } from "http-status-codes";
import IProduct from "../types/product.schema";
import { addBidToExpiryQueue } from "../queues/bid.queue";

class BidController {

    // Seller sees this -> These are bids that seller receives for their product
    static async getAllReceivedBids(req: Request, res: Response) {
        try {
            const bids = await Bid.find({
                status: "pending",
                seller: req.user?._id,
                $sort: { createdAt: -1 }
            }).populate("buyer");

            return res.status(StatusCodes.OK).json({ success: true, bids })
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error getting bids!");
            return res.status(status).json(errResponse);
        }
    }

    // Buyer sees this -> These are bids that has been accepted by sellers
    static async getAllAcceptedBids(req: Request, res: Response) {
        try {
            const bids = await Bid.find({ buyer: req.user?._id, status: "accepted" })
                .sort({ createdAt: -1 })
                .populate("buyer");
            if (!bids) throw new AppError(StatusCodes.NOT_FOUND, "Bids not found")

            return res.status(StatusCodes.OK).json({ success: true, bids });
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error fetching bids")
            return res.status(status).json(errResponse);
        }
    }

    static async getRejectedBids(req: Request, res: Response) {
        try {
            const bids = await Bid.find({ seller: req.user?._id, status: "rejected" })
                .sort({ createdAt: -1 })
                .populate(["product"]);
            if (!bids.length) throw new AppError(StatusCodes.NOT_FOUND, "No bids found");

            return res.status(StatusCodes.OK).json({ success: true, bids });
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = await AppError.handle(error, "Error fetching rejected bids")
            return res.status(status).json(errResponse);
        }
    }

    static async createBid(req: Request, res: Response) {
        try {
            const { productID } = req.params;
            const { negotiating_price } = req.body;
            if (!negotiating_price) {
                throw new AppError(StatusCodes.UNPROCESSABLE_ENTITY, "Negotiating price required");
            }
            if (negotiating_price < 0) {
                throw new AppError(StatusCodes.BAD_REQUEST, "Negotiating price must be a positive integer");
            }

            const product = await Product.findOne({ _id: productID, deleted_at: { $exists: false } });
            if (!product) throw new AppError(StatusCodes.NOT_FOUND, "Product not found!");
            if (!product.is_negotiable) throw new AppError(StatusCodes.NOT_FOUND, "Product not found!");

            const bidData = {
                seller: product.owner,
                buyer: req.user?._id,
                negotiating_price,
                product: new Types.ObjectId(productID),
                expires: Next5Mins()
            };

            const bid = await Bid.create(bidData);
            await addBidToExpiryQueue(bid.id);

            //!TODO => Send push notifications for bid creation here
            return res.status(StatusCodes.OK).json({
                success: true,
                message: "Bid successful"
            });
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error sending bid!")
            return res.status(status).json(errResponse);
        }
    }

    // N.B => Once a bid is accepted all other bids become auto rejected
    static async acceptBid(req: Request, res: Response) {
        const session = await startSession();
        try {
            session.startTransaction();

            const { bidID } = req.params;
            const bid = await Bid.findById(bidID)
                .populate("product")
                .session(session);
            if (!bid) throw new AppError(StatusCodes.NOT_FOUND, "Bid not found");

            await Product.findOneAndUpdate(
                { _id: (bid.product as any as IProduct)._id, deleted_at: { $exists: false } },
                { active_bid: bid._id }
            ).session(session);

            // Ensure current user is product owner
            const userId = req.user?._id;
            const isProductOwner = compareObjectID(userId, bid.seller);
            if (!isProductOwner) throw new AppError(StatusCodes.NOT_FOUND, "bid not found!");

            bid.status = "accepted";
            bid.expires = Next5Mins();

            await Bid.updateMany({ product: bid.product }, { status: "rejected" }).session(session);
            await bid.save({ session });

            await addBidToExpiryQueue(bid.id);
            await session.commitTransaction();
            return res.status(StatusCodes.OK).json({ success: true, message: "Bid accepted successfully", bid });
        } catch (error) {
            await session.abortTransaction();
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "An error occured while trying to accept bid");
            return res.status(status).json(errResponse);
        } finally {
            await session.endSession();
        }
    }

    static async rejectBid(req: Request, res: Response) {
        try {
            const { bidID } = req.params;
            const bid = await Bid.findById(bidID);
            if (!bid) throw new AppError(StatusCodes.NOT_FOUND, "Bid not found!");


            // ENSURE CURRENT USER IS PRODUCT OWNER
            const currentUser = req.user?._id;
            const isProductOwner = compareObjectID(currentUser, bid.seller);
            if (!isProductOwner) throw new AppError(StatusCodes.NOT_FOUND, "Bid not found!");

            bid.status = "rejected";
            await bid.save();

            return res.status(StatusCodes.OK).json({ success: true, message: "Bid rejected", bid });
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Bid rejection failed");
            return res.status(status).json(errResponse);
        }

    }

    static async deleteBid(req: Request, res: Response) {
        try {
            const { bidID } = req.params;
            const bid = await Bid.findOneAndDelete({ _id: bidID, buyer: req.user?._id });
            if (!bid) throw new AppError(StatusCodes.NOT_FOUND, "Could not delete that bid");

            return res.status(StatusCodes.OK).json({ success: true, message: "Bid deleted successfuly" })
        } catch (error) {
            logger.error(error);
            const [status, errResponse] = AppError.handle(error, "Error deleting bid")
            return res.status(status).json(errResponse);
        }
    }
}

export default BidController;
