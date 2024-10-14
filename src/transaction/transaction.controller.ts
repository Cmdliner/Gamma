import { Request, Response } from "express";
import { startSession, Types } from "mongoose";
import Wallet from "../user/wallet.model";
import FincraService from "../lib/fincra.service";
import Transaction from "./transaction.model";
import IUser from "../types/user.schema";
import Product from "../product/product.model";

class TransactionController {
    static async withdrawFromWallet(req: Request, res: Response) {
        try {
            const user = req.user?._id as Types.ObjectId;
            const bankAccount = req.user?.account_no as number;


            // Get user wallet
            const wallet = await Wallet.findOne({ user });
            if (!wallet) throw { custom_error: true, mssg: "Error finding wallet" };

            const withdrawal = await FincraService.withdrawFunds(wallet, bankAccount);


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
        // const session = await startSession();
        try {
            const userId = req.user?._id;
            const { productID } = req.params;
            const { payment_method } = req.body;
            if(!payment_method) {
                return res.status(422).json({ error: true, message: "Payment method required!"})
            }
            
            // session.startTransaction();
            const product = await Product.findById(productID)//.session(session);
            if (!product || product.status !== "available") {
                return res.status(400).json({ error: "Product not available!" });
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
            }, { new: true, /*session */});
            if (!updatedProduct) {
                return res.status(400).json({ error: "Product is currently unavaliable for purchase" });
            }
            const itemPurchaseTransaction = await Transaction.create([{
                bearer: userId,
                kind: "product_payment",
                amount: product.price,
                product: productID,
                payment_method
            }], { /* session */ });


            // Initiate payment with fincra then commit transaction to db
            const fincraResponse = await FincraService.collectPayment(product, req.user!);
            console.log(fincraResponse);
            // await session.commitTransaction();

            return res.status(200).json({ success: true, transaction_id: itemPurchaseTransaction[0]._id, fincra: fincraResponse });


        } catch (error) {
            // await session.abortTransaction();
            console.error(error);
            return res.status(500).json({ error: "Error purchasing item" });
        } /* finally {
            // await session.endSession();
        } */
    }

}

export default TransactionController;