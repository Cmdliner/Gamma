# Oyeah Escrow!

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
- Bvn can be resued (bvn.encrypted_data ????) //encryption gives fdifferent values; only decryption is uniform
- Timeout for payment (maybe 5 minutes)
- Referrer doesnt get rewarded


## TODOS
- Payment to wallet when buying
- deals (pending, accepted )
- Sanitize inputs for all actions (impl max char length, rm whitespace, dont allow special characters)
- Notifications -> bid info, payment, updates (Any product / transaction related event)
- On buyer payment create transaction receipts with method of payment and transaction id


## REMEMBER
- Upload can only error due to client-side errors; upload middleware is very stable
- Implement https
    
- change min limit for images in products validation for all from 1 to 10
- change ref to uppercase collection name when trying to ref sub_docs in a new model

## Project structure

```sh
.
├── bun.lockb
├── dist
│   ├── app.js
│   ├── auth
│   │   ├── auth.controller.js
│   │   ├── auth.model.js
│   │   ├── auth.routes.js
│   │   └── auth.service.js
│   ├── bid
│   │   ├── bid.controller.js
│   │   ├── bid.model.js
│   │   └── bid.routes.js
│   ├── config
│   │   ├── db.js
│   │   └── settings.js
│   ├── dispute
│   │   ├── dispute.controller.js
│   │   ├── dispute.model.js
│   │   └── dispute.routes.js
│   ├── lib
│   │   ├── bank_codes.js
│   │   ├── email.service.js
│   │   ├── fincra.service.js
│   │   ├── location.data.js
│   │   ├── main.js
│   │   └── paystack.service.js
│   ├── middlewares
│   │   ├── auth.middlewares.js
│   │   ├── ratelimit.middleware.js
│   │   └── upload.middlewares.js
│   ├── notification
│   │   └── notification.model.js
│   ├── payment
│   │   ├── payment.controller.js
│   │   ├── payment.routes.js
│   │   ├── transaction.model.js
│   │   ├── webhook.controller.js
│   │   └── webhook.service.js
│   ├── product
│   │   ├── product.controller.js
│   │   ├── product.model.js
│   │   ├── product.routes.js
│   │   └── product.service.js
│   ├── __tests__
│   │   └── auth.test.js
│   ├── types
│   │   ├── ad.enums.js
│   │   ├── bid.schema.js
│   │   ├── common.js
│   │   ├── electronics.schema.js
│   │   ├── gadget.schema.js
│   │   ├── generic.schema.js
│   │   ├── landed_property.schema.js
│   │   ├── multer_file.js
│   │   ├── otp.schema.js
│   │   ├── phone_number.schema.js
│   │   ├── product.dto.js
│   │   ├── product.schema.js
│   │   ├── transaction.schema.js
│   │   ├── user.dto.js
│   │   ├── user.schema.js
│   │   ├── vehicle.schema.js
│   │   ├── wallet.schema.js
│   │   └── webhook.schema.js
│   ├── user
│   │   ├── user.controller.js
│   │   ├── user.model.js
│   │   ├── user.routes.js
│   │   └── wallet.model.js
│   └── validations
│       ├── auth.validation.js
│       ├── payment.validation.js
│       └── product.validation.js
├── Dockerfile
├── nodemon.json
├── package.json
├── README.md
├── scripts
│   └── create_env.sh
├── src
│   ├── app.ts
│   ├── auth
│   │   ├── auth.controller.ts
│   │   ├── auth.model.ts
│   │   ├── auth.routes.ts
│   │   └── auth.service.ts
│   ├── bid
│   │   ├── bid.controller.ts
│   │   ├── bid.model.ts
│   │   └── bid.routes.ts
│   ├── config
│   │   ├── db.ts
│   │   └── settings.ts
│   ├── dispute
│   │   ├── dispute.controller.ts
│   │   ├── dispute.model.ts
│   │   └── dispute.routes.ts
│   ├── env.d.ts
│   ├── express.d.ts
│   ├── lib
│   │   ├── bank_codes.ts
│   │   ├── email.service.ts
│   │   ├── fincra.service.ts
│   │   ├── location.data.ts
│   │   ├── main.ts
│   │   └── paystack.service.ts
│   ├── middlewares
│   │   ├── auth.middlewares.ts
│   │   ├── ratelimit.middleware.ts
│   │   └── upload.middlewares.ts
│   ├── notification
│   │   └── notification.model.ts
│   ├── payment
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
│   ├── __tests__
│   │   └── auth.test.ts
│   ├── types
│   │   ├── ad.enums.ts
│   │   ├── bid.schema.ts
│   │   ├── common.ts
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
│   └── verification_email.html
└── tsconfig.json

31 directories, 127 files
```