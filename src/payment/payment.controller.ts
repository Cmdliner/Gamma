import { Request, Response } from "express";
import { startSession, Types } from "mongoose";
import Wallet from "../user/wallet.model";
import FincraService from "../lib/fincra.service";
import Transaction from "./transaction.model";
import IUser from "../types/user.schema";
import Product from "../product/product.model";
import { compareObjectID, Next5Mins } from "../lib/main";
import { AdSponsorshipValidation, ItemPurchaseValidation } from "../validations/payment.validation";
import Bid from "../bid/bid.model";

class PaymentController {

    static async withdrawFromWallet(req: Request, res: Response) {
        try {
            const user = req.user as IUser;
            const bankAccount = user.bank_details?.account_no as number;
            const { amount_to_withdraw } = req.body;

            // Get user wallet
            const wallet = await Wallet.findById(user.wallet);
            if (!wallet) return res.status(404).json({ error: true, message: "Error finding wallet" });

            // Check amount to withdraw
            if (amount_to_withdraw > wallet.balance) {
                return res.status(400).json({ error: true, message: "Insufficient funds!" });
            }

            await FincraService.withdrawFunds(wallet, bankAccount);

            return res.status(200).json({ success: true, message: "Withdrawal has been initiated" })


        } catch (error) {
            if ((error as any).custom_error) {
                return res.status(400).json({ error: (error as any).message });
            }
            return res.status(500).json({ error: "Error withdrawing money from wallet" });
        }
    }

    static async getTransactionHistory(req: Request, res: Response) {
        try {
            const user = req.user as IUser;
            const transactions = await Transaction.find({ bearer: user._id }).sort({ createdAt: -1 });
            return res.status(200).json({ success: "Transactions found", transactions });
        } catch (error) {
            console.error(error);
            return res.send(500).json({ error: "Error getting transaction history" });
        }
    }

    static async purchaseItem(req: Request, res: Response) {
        const session = await startSession();
        try {
            const userId = req.user?._id;
            const { productID, bidID } = req.params;
            const { payment_method } = req.body;
            if (!payment_method) {
                return res.status(422).json({ error: true, message: "Payment method required!" })
            }

            // VALIDATION LOGIC
            const { error } = ItemPurchaseValidation.validate({ payment_method });
            if (error) {
                return res.status(500).json({ error: true, message: error.details[0].message });
            }

            session.startTransaction();
            const product = await Product.findById(productID).session(session);
            if (!product || product.status !== "available") {
                return res.status(400).json({ error: true, message: "Product not available!" });
            }

            // CHECK IF THIS REQUEST IS FOR A BID
            let bidPrice = undefined; // Initialize bid price
            if (bidID) {
                const bid = await Bid.findOne({ _id: bidID, status: "accepted" }).session(session);
                if (!bid) return res.status(404).json({ error: true, message: "Couldn't find bid" });

                // Ensure bid has not yet expired
                if (bid.expires.valueOf() < Date.now()) {
                    bid.status = "expired";
                    await bid.save({ session });
                    return res.status(400).json({ error: true, message: "Bid expired!" })
                }

                const isBidder = compareObjectID(bid.buyer, req.user?._id!);
                if (!isBidder) return res.status(403).json({ error: true, message: "Action Forbidden!" });

                // Set bid Price to that negotiated
                bidPrice = bid.negotiating_price as number;
            }

            const updatedProduct = await Product.findOneAndUpdate({
                _id: productID,
                status: "available",
                "purchase_lock.is_locked": false
            }, {
                status: "processing_payment",
                purchase_lock: {
                    is_locked: true,
                    locked_at: Date.now(),
                    locked_by: userId,
                }
            }, { new: true, session });
            if (!updatedProduct) {
                return res.status(400).json({ error: true, message: "Product is currently unavaliable for purchase" });
            }

            // CREATE TRANSACTION FOR PRODUCT PURCHASE
            const itemPurchaseTransaction = new Transaction({
                bearer: userId,
                kind: "product_payment",
                // set to negotiated price or actual price based on whether it's a bid or not
                amount: bidPrice ? bidPrice : product.price,
                product: productID,
                details: `For purchase of ${product.description}`,
                payment_method
            });
            await itemPurchaseTransaction.save({ session });
            const transactionRef = itemPurchaseTransaction.id;


            // Initiate payment with fincra then commit transaction to db
            const fincraResponse = await FincraService.collectPayment(product, req.user!, transactionRef, payment_method, bidPrice);
            await session.commitTransaction();

            return res.status(200).json({ success: true, transaction_id: itemPurchaseTransaction._id, fincra: fincraResponse });


        } catch (error) {
            await session.abortTransaction();
            console.error(error);
            return res.status(500).json({ error: "Error purchasing item" });
        } finally {
            await session.endSession();
        }
    }

    static async sponsorAd(req: Request, res: Response) {

        const { productID } = req.params;
        const { sponsorship_duration, payment_method } = req.body;

        const session = await startSession();

        try {
            if (!sponsorship_duration || !payment_method) {
                return res.status(422).json({ error: true, message: "sponsorship_duration and payment_method required!" });
            }

            // VALIDATE SPONSORSHIP DURATION AND PAYMENT METHOD
            const { error } = AdSponsorshipValidation.validate({ sponsorship_duration, payment_method });
            if (error) {
                return res.status(422).json({ error: true, messaage: error.details[0].message })
            }

            // START TRANSACTION
            await session.startTransaction();

            const product = await Product.findById(productID).session(session);
            if (!product) {
                return res.status(404).json({ error: true, message: "Product not found!" });
            }

            const isProductOwner = compareObjectID(product.owner, req.user?._id!);
            if (!isProductOwner) {
                return res.status(403).json({ error: true, message: "Forbidden!!!" });
            }


            // Create Transaction for ad sponsorhsip
            const transaction = new Transaction({
                kind: "ad_sponsorhip",
                bearer: req.user?._id,
                product: product._id,
                status: "pending",
                payment_method: payment_method,
                details: `For sponsorship of product: "${product.description}"`,
                amount: sponsorship_duration === "1Week" ? 7000 : 22_000 //!TODO => FIX THIS
            })
            await transaction.save({ session });

            const fincraRes = await FincraService.sponsorProduct(product, req.user!, sponsorship_duration, transaction.id, payment_method);

            await session.commitTransaction();

            return res.status(200).json({ success: true, transaction_id: transaction.id, fincra: fincraRes })
        } catch (error) {
            await session.abortTransaction();
            console.error(error);
            return res.status(500).json({ error: true, message: "Error occured during while trying to sponsor product" });
        } finally {
            await session.endSession();
        }
    }

    static async withdrawRewards(req: Request, res: Response) { }

}
export default PaymentController;