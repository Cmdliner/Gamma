export interface ChargeSuccessPayload {
    data: {
        id: number;
        authorization: {
            mode: null;
            redirect: null;
            metadata: null;
        };
        auth_model: null;
        amount: number;
        amountReceived: number;
        currency: "NGN";
        fee: number;
        vat: number;
        message: string
        status: "success";
        reference: string;
        description: string;
        type: "bank_transfer";
        customer: {
            name: string;
            email: string;
            phoneNumber: string;
        };
        metadata: {
            customer_id: string;
            product_id: string;
        };
        settlementDestination: "wallet";
        virtualAccount: {
            bankName: string;
            id: string;
            bankCode: string;
            accountName: string;
            accountNumber: string;
            sessionId: null;
            channelName: null;
            payerAccountNumber: null;
            payerAccountName: null;
            payerBankName: null;
            payerBankCode: null;
            expiresAt: Date;
            business: string;
        };
        amountToSettle: number;
        chargeReference: string;
    }
} 