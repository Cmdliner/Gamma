import axios from "axios";

class PaystackService {

	private static async getBankCodes() {
		const headers = {
			"Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
		}
		await axios.get("", { headers })
	}

	static async resolveBvn() { }


	static async validateAccountDetails(accountNo: string, bankCode: string): Promise<object | null> {
		const headers = {
			"Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
		}

		const ACCOUNT_RESOLVE_URL = `${process.env.PAYSTACK_URI}/bank/resolve?account_number=${accountNo}&bank_code=${bankCode}`;

		try {
			const res = await axios.get(ACCOUNT_RESOLVE_URL, { headers });
			if (res.data.status == true) {
				return res.data.data;
			}
		} catch (error) {
			console.log(error);
		}

		return null;
	}
}


export default PaystackService;

