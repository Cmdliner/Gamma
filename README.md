# Oyeah! Escrow
<img
src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Frame%202085661018-gkNvrDBvplnTNvHPiyZXOl3oTizjE4.png"
alt="Oyeah! Escrow"
style="display: block; width: 100%; height: auto"
/>
The REST API server for the `OYeah! Escrow` platform

## How To Setup

- Ensure you have Node.js, tsc and npm installed or any other alternative package managers

### Using bun (prefarable method)

If you don't have bun already installed run:

```sh
npm i -g bun
```

### Create the env file by running the create_env.sh script

```sh
bash scripts/create_env.sh
```

- Setup your database and obtain a connection string
- fill in the keys in the .env file appropriately

### Start the development server

```sh
bun run dev
```

## BUGS
- Payment links might never expire (check again with fincra)
- Pending sponsorships can be retried even when previous payment status hasn't been confirmed
  
## TODOS
- user suspension by admin
- Consistent user phone mumber containing country code and validation should be done
- Rm ads on activate to rm from market place
- Implement under_review for ads
- Indempotency key on payment; store in redis cache
- Handle actual refund logic in cron job
- Seller reject refund enter dispute
- Send tx receipts with email to seller and buyer for payments and also on ad sponsorship
- Write tests for auth, product and payment

## REMEMBER
- Upload can only error due to client-side errors; upload middleware is very stable
- Notifications -> bid info, payment, updates (Any product / transaction related event)
- On launch mv to safehaven actual endpoint for payments not sandbox

## Project structure

```sh
.
├── bun.lockb
├── client_assertion
├── Dockerfile
├── logs
│   └── app-error.log
├── package.json
├── privatekey.pem
├── publickey.cer
├── README.md
├── scripts
│   └── create_env.sh
├── src
│   ├── app.ts
│   ├── auth
│   │   ├── auth.controller.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.service.ts
│   │   └── otp.model.ts
│   ├── bid
│   │   ├── bid.controller.ts
│   │   ├── bid.model.ts
│   │   └── bid.routes.ts
│   ├── config
│   │   ├── app.config.ts
│   │   ├── db.ts
│   │   └── logger.config.ts
│   ├── dispute
│   │   ├── dispute.controller.ts
│   │   ├── dispute.model.ts
│   │   └── dispute.routes.ts
│   ├── env.d.ts
│   ├── express.d.ts
│   ├── init.ts
│   ├── jobs
│   │   ├── cron.scheduler.ts
│   │   └── jobs.service.ts
│   ├── lib
│   │   ├── apperror.ts
│   │   ├── bank_codes.ts
│   │   ├── email.service.ts
│   │   ├── fincra.service.ts
│   │   ├── location.data.ts
│   │   ├── paystack.service.ts
│   │   ├── safehaven.service.ts
│   │   └── utils.ts
│   ├── middlewares
│   │   ├── auth.middlewares.ts
│   │   ├── ratelimit.middleware.ts
│   │   └── upload.middlewares.ts
│   ├── notification
│   │   ├── notification.controller.ts
│   │   ├── notification.model.ts
│   │   ├── notification.routes.ts
│   │   └── notification.service.ts
│   ├── payment
│   │   ├── deals.routes.ts
│   │   ├── payment.controller.ts
│   │   ├── payment.routes.ts
│   │   ├── transaction.model.ts
│   │   ├── webhook.controller.ts
│   │   └── webhook.service.ts
│   ├── product
│   │   ├── product.controller.ts
│   │   ├── product.model.ts
│   │   ├── product.routes.ts
│   │   └── product.service.ts
│   ├── server.ts
│   ├── __tests__
│   │   ├── auth.test.ts
│   │   └── payment.test.ts
│   ├── types
│   │   ├── ad.enums.ts
│   │   ├── bid.schema.ts
│   │   ├── common.ts
│   │   ├── common.type.ts
│   │   ├── electronics.schema.ts
│   │   ├── gadget.schema.ts
│   │   ├── generic.schema.ts
│   │   ├── landed_property.schema.ts
│   │   ├── multer_file.ts
│   │   ├── otp.schema.ts
│   │   ├── phone_number.schema.ts
│   │   ├── product.dto.ts
│   │   ├── product.schema.ts
│   │   ├── transaction.schema.ts
│   │   ├── user.dto.ts
│   │   ├── user.schema.ts
│   │   ├── vehicle.schema.ts
│   │   ├── wallet.schema.ts
│   │   └── webhook.schema.ts
│   ├── user
│   │   ├── user.controller.ts
│   │   ├── user.model.ts
│   │   ├── user.routes.ts
│   │   └── wallet.model.ts
│   └── validations
│       ├── auth.validation.ts
│       ├── payment.validation.ts
│       └── product.validation.ts
├── templates
│   ├── password_reset.html
│   ├── payment_refund.html
│   ├── release_funds.html
│   └── verification_email.html
└── tsconfig.json

19 directories, 88 files
``