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

/* 

{
  id: 56121,
  amountCharged: 500,
  amountReceived: 500,
  recipient: {
    name: "Abiola Abiade",
    accountNumber: "9136229184",
    type: "individual",
    email: "ramatabiade@gmail.com",
  },
  fee: 0,
  rate: 1,
  paymentScheme: null,
  paymentDestination: "bank_account",
  sourceCurrency: "NGN",
  destinationCurrency: "NGN",
  status: "successful",
  createdAt: "2024-12-22T09:42:28.000Z",
  updatedAt: "2024-12-22T09:42:28.000Z",
  reference: "39d6c402eb8343e6",
  customerReference: "6767df02866905ca863a75cd",
  reason: "Disbursement was successful",
  traceId: "999999230619134112418465441784",
  valuedAt: "2024-12-22T09:42:28.000Z",
  isNip: false,
}
*/