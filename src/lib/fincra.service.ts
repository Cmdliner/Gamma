import axios, { AxiosRequestConfig } from "axios";
import { Fincra } from "fincra-node-sdk";

class FincraService {

    private static fincra = new Fincra(
        process.env.FINCRA_PUBLIC_KEY,
        process.env.FINCRA_SECRET_KEY,
        { sandbox: process.env.NODE_ENV === "production" ? false : true }
    );

    static async getBusinessInfo() {
        try {
            const business = await FincraService.fincra.business.getBusinessId();
            return business;

        } catch (error) {
            console.error((error as Error).stack);
            throw error;
        }
    }

    static async createVirtualWallet() {
        try {
            const opts: AxiosRequestConfig = {
                url: "https://sandboxapi.fincra.com/profile/virtual-accounts/requests",
                method: "POST",
                headers: {
                    "api-key": process.env.FINCRA_SECRET_KEY,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                data: {
                    "currency": "NGN",
                    "accountType": "individual",
                    "KYCInformation": {
                        "firstName": "John",
                        "lastName": "Doe",
                        "email": "customer@theiremail.com",
                        "bvn": "12345678901"
                    },
                    "channel": "wema"
                }
                
            }
            const res = await axios.request(opts);
            return res;
        } catch (error) {
            console.error(error);
            throw error;
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
