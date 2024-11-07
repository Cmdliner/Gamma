import { Request, Response } from "express";
import FincraService from "../lib/fincra.service";
import Wallet from "../user/wallet.model";
import { startSession, Types } from "mongoose";
import User from "../user/user.model";
import Product from "../product/product.model";
import IUser from "../types/user.schema";
import Transaction from "./transaction.model";

class WebhookController {

    static async confirm(req: Request, res: Response) {
        const session = await startSession();
        try {
            console.log("web hook");
            const webhookSignature = req.headers["signature"] as string;
            const payload = req.body;

            const shouldProcess = await FincraService.validateWebhook(webhookSignature, payload);
            if (!shouldProcess) {
                return res.status(400).json({ error: true, message: "Invalid webhook!" });
            }

            // Handle individual events 
            switch (payload.event) {
                case "virtualaccount.approved":
                    return res.status(200).json({ success: true });

                case "charge.successful":
                    if (payload.data.status === "success") {
                        const { customer_id, product_id } = payload.data.metadata;

                        const product = await Product.findById(product_id).populate("owner");
                        if (!product) throw new Error();
                        product.status = "sold";
                        await product.save();

                        // Seller
                        const sellerWallet = await Wallet.findById((product.owner as unknown as IUser).wallet);
                        if (!sellerWallet) throw new Error();
                        sellerWallet.balance += parseInt(payload.data.amountToSettle);
                        await sellerWallet.save();


                        // Customer
                        const customer = await User.findById(customer_id);
                        if (!customer) throw new Error();

                        if (customer.account_status === "dormant") {
                            customer.account_status = "active";

                            if (customer.referred_by) {
                                const referrer = await User.findById(customer.referred_by);
                                if (!referrer) throw new Error();
                                referrer.rewards.balance += 500;
                                await referrer.save();
                            }

                        }
                        await customer.save();

                        // Transaction
                        const transaction = await Transaction.findById(payload.data.reference);
                        if (!transaction) throw new Error();
                        transaction.status = "success";
                        await transaction.save();




                        console.log(payload.data);
                    }
                    break;
                default:
                    console.log("That event not found");

            }
        } catch (error) {

        }
    }
}

export default WebhookController;

/* 
{
  status: true,
  message: "Hosted link generated",
  data: {
    link: "https://sandbox-checkout.fincra.com/pay/fcr-p-7db8160151",
    reference: "672c8d54ba63a1b935801b0a",
    payCode: "fcr-p-7db8160151",
  },
}
web hook
{
  id: 40817,
  authorization: {
    mode: null,
    redirect: null,
    metadata: null,
  },
  auth_model: null,
  amount: 203010,
  amountReceived: 203010,
  currency: "NGN",
  fee: 3010,
  vat: 210,
  message: "",
  status: "success",
  reference: "672c8d54ba63a1b935801b0a",
  description: "checkout",
  type: "bank_transfer",
  customer: {
    name: "Adeyemi Abiade",
    email: "abiadeabdulazeez@gmail.com",
    phoneNumber: "08016034711",
  },
  metadata: {
    customer_id: "672c843d4fd44527e3cc6e51",
    product_id: "672c869e4fd44527e3cc6e68",
  },
  settlementDestination: "wallet",
  virtualAccount: {
    bankName: "Providus Bank",
    id: "6537d6b627fef4d4380828a4",
    bankCode: "101",
    accountName: "Fincra Checkout",
    accountNumber: "9600314830",
    sessionId: null,
    channelName: null,
    payerAccountNumber: null,
    payerAccountName: null,
    payerBankName: null,
    payerBankCode: null,
    expiresAt: "2024-09-26T22:38:18.000Z",
    business: "63da866cb938c4e0b871f514",
  },
  amountToSettle: 200000,
  chargeReference: "fcr-bt-e5fbd5c7d7cc1289e",
}
That event not found

*/