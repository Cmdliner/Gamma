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


export interface PayoutSuccessPayload {
        data: {
            id: number;
            amountCharged: number;
            amountReceived: number;
            recipient: {
                name: string;
                accountNumber: string;
                type: string;
                email: string;
            },
            fee: number;
            rate: number;
            paymentScheme: string;
            paymentDestination: string;
            sourceCurrency: string;
            destinationCurrency: string;
            status: string; // successful
            createdAt: Date;
            updatedAt: Date;
            reference: string;
            reason: string;
            traceId: null,
            valuedAt: Date;
        }
}