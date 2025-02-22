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
            amount_expected: number;
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
        customerReference: string;
        reason: string;
        traceId: null,
        valuedAt: Date;
    }
}



type ProductId = string;
type TransactionId = string;

export interface IVirtualAccountTransferData {
    _id: string,
    client: string,
    virtualAccount: string,
    sessionId: string,
    nameEnquiryReference: string;
    paymentReference: string,
    externalReference: `${TransactionId}::${ProductId}`,
    isReversed: boolean,
    reversalReference: string,
    provider: "BANK",
    providerChannel: "TRANSFER",
    providerChannelCode: "IBS",
    destinationInstitutionCode: "999240",
    creditAccountName: "OyeahTechnologi Checkout",
    creditAccountNumber: "6020355854",
    creditBankVerificationNumber: null,
    creditKYCLevel: "3",
    debitAccountName: "OYEAH TECHNOLOGIES LIMITED",
    debitAccountNumber: string,
    debitBankVerificationNumber: null,
    debitKYCLevel: string,
    transactionLocation: string,
    narration: string,
    amount: 7000,
    fees: 35,
    vat: 0,
    stampDuty: 0,
    responseCode: "00",
    responseMessage: string,
    status: string, // ["Completed" | ]
    isDeleted: boolean,
    createdAt: string, // timestamps
    declinedAt: string, // timestamps
    updatedAt: string, //timestamps
    __v: 0,

}