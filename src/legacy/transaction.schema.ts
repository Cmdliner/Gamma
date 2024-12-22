Withdrawal response
{
  success: true,
  message: "Payout processed successfully",
  data: {
    id: 56122,
    reference: "bbe6251f71ae4f77",
    customerReference: "6767e343be9a9376aa4e60e0",
    status: "processing",
    documentsRequired: [],
  },
}
End ofWithdrawal response
web hook
{
  event: "payout.successful",
  data: {
    id: 56122,
    amountCharged: 47300,
    amountReceived: 47300,
    recipient: {
      name: "Adeyemi Abiade",
      accountNumber: "9011974957",
      type: "individual",
      email: "abiadeabdulazeez@gmail.com",
    },
    fee: 0,
    rate: 1,
    paymentScheme: null,
    paymentDestination: "bank_account",
    sourceCurrency: "NGN",
    destinationCurrency: "NGN",
    status: "successful",
    createdAt: "2024-12-22T10:00:37.000Z",
    updatedAt: "2024-12-22T10:00:37.000Z",
    reference: "bbe6251f71ae4f77",
    customerReference: "6767e343be9a9376aa4e60e0",
    reason: "Disbursement was successful",
    traceId: "999999230619134112418465441784",
    valuedAt: "2024-12-22T10:00:37.000Z",
    isNip: false,
  },
}
