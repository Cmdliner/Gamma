// mono config
// monoService.js
const axios = require('axios');
require('dotenv').config();

const MONO_API_URL = 'https://api.mono.co/v1'; // Base URL for Mono API
const MONO_API_KEY = process.env.MONO_API_KEY;

const verifyBVN = async (bvn) => {
    try {
        const response = await axios.get(`${MONO_API_URL}/bvn/${bvn}`, {
            headers: {
                Authorization: `Bearer ${MONO_API_KEY}`
            }
        });
        return response.data; // Return the verification data
    } catch (error) {
        throw new Error('BVN verification failed');
    }
};

const verifyBankAccount = async (accountNumber, bankCode) => {
    try {
        const response = await axios.get(`${MONO_API_URL}/bank_account/${accountNumber}`, {
            headers: {
                Authorization: `Bearer ${MONO_API_KEY}`
            },
            params: { bank_code: bankCode }
        });
        return response.data; // Return the verification data
    } catch (error) {
        throw new Error('Bank account verification failed');
    }
};

module.exports = { verifyBVN, verifyBankAccount };






// moo verification endpoints

// routes.js
const express = require('express');
const { verifyBVN, verifyBankAccount } = require('./monoService');

const router = express.Router();

router.post('/verify-bvn', async (req, res) => {
    const { bvn } = req.body;
    try {
        const verificationResult = await verifyBVN(bvn);
        res.status(200).json(verificationResult);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/verify-bank-account', async (req, res) => {
    const { accountNumber, bankCode } = req.body;
    try {
        const verificationResult = await verifyBankAccount(accountNumber, bankCode);
        res.status(200).json(verificationResult);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
