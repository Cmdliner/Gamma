"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// mono config
// monoService.js
const axios = require('axios');
require('dotenv').config();
const MONO_API_URL = 'https://api.mono.co/v1'; // Base URL for Mono API
const MONO_API_KEY = process.env.MONO_API_KEY;
const verifyBVN = (bvn) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios.get(`${MONO_API_URL}/bvn/${bvn}`, {
            headers: {
                Authorization: `Bearer ${MONO_API_KEY}`
            }
        });
        return response.data; // Return the verification data
    }
    catch (error) {
        throw new Error('BVN verification failed');
    }
});
const verifyBankAccount = (accountNumber, bankCode) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios.get(`${MONO_API_URL}/bank_account/${accountNumber}`, {
            headers: {
                Authorization: `Bearer ${MONO_API_KEY}`
            },
            params: { bank_code: bankCode }
        });
        return response.data; // Return the verification data
    }
    catch (error) {
        throw new Error('Bank account verification failed');
    }
});
module.exports = { verifyBVN, verifyBankAccount };
// moo verification endpoints
// routes.js
const express = require('express');
// const { verifyBVN, verifyBankAccount } = require('./monoService');
const router = express.Router();
router.post('/verify-bvn', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { bvn } = req.body;
    try {
        const verificationResult = yield verifyBVN(bvn);
        res.status(200).json(verificationResult);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
router.post('/verify-bank-account', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { accountNumber, bankCode } = req.body;
    try {
        const verificationResult = yield verifyBankAccount(accountNumber, bankCode);
        res.status(200).json(verificationResult);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
module.exports = router;
