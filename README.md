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
  
## TODOS
- Rm ads on activate to rm from market place
- Indempotency key on payment; store in redis cache
- Handle actual refund logic in cron job
- Seller reject refund enter dispute    
- Send tx receipts with email to seller and buyer for payments and also on ad sponsorship
- Write tests for auth, product and payment

## KEY POINTS TO REMEMBER
- Upload can only error due to client-side errors; upload middleware is very stable
- Notifications -> bid info, paym   ent, updates (Any product / transaction related event)
- On launch mv to safehaven actual endpoint for payments not sandbox
- Ads run forever till expiry or till the money reaches the seller's wallet 
(i.e purchase completed) any active ad at that point is set to completed


## Project structure

```sh
.
├── bun.lockb
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
│   ├── config
│   │   ├── app.config.ts
│   │   ├── db.ts
│   │   ├── ioredis.config.ts
│   │   └── logger.config.ts
│   ├── controllers
│   │   ├── admin.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── bid.controller.ts
│   │   ├── dispute.controller.ts
│   │   ├── notification.controller.ts
│   │   ├── payment.controller.ts
│   │   ├── product.controller.ts
│   │   ├── user.controller.ts
│   │   └── webhook.controller.ts
│   ├── env.d.ts
│   ├── express.d.ts
│   ├── init.ts
│   ├── lib
│   │   ├── bank_codes.ts
│   │   ├── error.handler.ts
│   │   ├── location.data.ts
│   │   ├── product_category.ts
│   │   ├── safehaven_bankcodes.ts
│   │   └── utils.ts
│   ├── middlewares
│   │   ├── admin.middleware.ts
│   │   ├── auth.middlewares.ts
│   │   ├── ratelimit.middleware.ts
│   │   └── upload.middlewares.ts
│   ├── models
│   │   ├── abuse.model.ts
│   │   ├── admin.model.ts
│   │   ├── bid.model.ts
│   │   ├── dispute.model.ts
│   │   ├── notification.model.ts
│   │   ├── otp.model.ts
│   │   ├── product.model.ts
│   │   ├── transaction.model.ts
│   │   ├── user.model.ts
│   │   └── wallet.model.ts
│   ├── queues
│   │   └── product.queue.ts
│   ├── routes
│   │   ├── admin.routes.ts
│   │   ├── auth.routes.ts
│   │   ├── bid.routes.ts
│   │   ├── deals.routes.ts
│   │   ├── dispute.routes.ts
│   │   ├── notification.routes.ts
│   │   ├── payment.routes.ts
│   │   ├── product.routes.ts
│   │   ├── user.routes.ts
│   │   └── webhook.routes.ts
│   ├── safehaven_response
│   ├── server.ts
│   ├── services
│   │   ├── auth.service.ts
│   │   ├── email.service.ts
│   │   ├── fincra.service.ts
│   │   ├── jobs.service.ts
│   │   ├── notification.service.ts
│   │   ├── payment.service.ts
│   │   ├── paystack.service.ts
│   │   ├── product.service.ts
│   │   └── webhook.service.ts
│   ├── __tests__
│   │   ├── auth.test.ts
│   │   └── payment.test.ts
│   ├── types
│   │   ├── abuse.schema.ts
│   │   ├── ad.enums.ts
│   │   ├── bid.schema.ts
│   │   ├── common.ts
│   │   ├── common.type.ts
│   │   ├── electronics.schema.ts
│   │   ├── gadget.schema.ts
│   │   ├── generic.schema.ts
│   │   ├── landed_property.schema.ts
│   │   ├── multer_file.ts
│   │   ├── notification.schema.ts
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
│   ├── validations
│   │   ├── auth.validation.ts
│   │   ├── payment.validation.ts
│   │   └── product.validation.ts
│   └── workers
│       └── product.worker.ts
├── templates
│   ├── ad_receipt.html
│   ├── password_reset.html
│   ├── payment_refund.html
│   ├── release_funds.html
│   └── verification_email.html
└── tsconfig.json

17 directories, 101 files
```