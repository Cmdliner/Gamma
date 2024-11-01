#!/bin/env sh

echo "PORT=<dev port>
MONGO_URI=<db uri>
EMAIL_ADDRESS=<email address>
EMAIL_SERVICE=<emailservice >
EMAIL_PASS=<email pass>
ACCESS_TOKEN_SECRET=< access token>
ONBOARDING_TOKEN_SECRET=<env key>" > .env.test