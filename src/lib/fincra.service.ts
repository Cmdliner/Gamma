import axios, { AxiosRequestConfig } from "axios";
import type { Request, Response } from "express";
import { Fincra } from "fincra-node-sdk";

class FincraService {

    private static fincra = new Fincra(
        process.env.FINCRA_PUBLIC_KEY,
        process.env.FINCRA_SECRET_KEY,
        { sandbox: process.env.NODE_ENV == "production" ? true : false }
    );

    static async getBusinessInfo(req: Request, res: Response) {
        try {
            const business = await FincraService.fincra.business.getBusinessId();
            return res.status(200).json(business);

        } catch (error) {
            console.error((error as Error).stack);
            return res.status(500).json("An error occured");
        }
    }

    static async createVirtualWallet() {
        try {
            
        } catch (error) {
            
        }
    }

    static async sponsorProduct() {
        try {
            const opts: AxiosRequestConfig = {};
            const res = await axios.request(opts);
        } catch (error) {
            //!TODO => Implement custom error calss that handles internally thrown errors
            throw {
                message: "An error occured",
                kind: "external_payment_error",
                ex_code: "EP001",
            };
        }
    }

    static async refundBalance() {
        try {
            const opts: AxiosRequestConfig = {};
            const res = await axios.request(opts);
        } catch (error) {
            //!TODO => Implement custom error calss that handles internally thrown errors
            throw {
                message: "An error occured",
                kind: "external_payment_error",
                ex_code: "EP001",
            };
        }
    }
}

export default FincraService;
