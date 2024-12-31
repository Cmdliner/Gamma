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
- Payment links might never expire (check again with fincra)

## TODOS 
- Impl soft delete
- Implement push notifications
- Sanitize inputs for all actions (impl max char length, rm whitespace, dont allow special characters)
- Notifications -> bid info, payment, updates (Any product / transaction related event)


## REMEMBER
- Upload can only error due to client-side errors; upload middleware is very stable
- Implement https

## Project structure

```sh
.
├── bun.lockb
├── Dockerfile
├── fincra
├── nodemon.json
├── package.json
├── push_notifs
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
│   ├── change_states.js
│   ├── config
│   │   ├── app.config.ts
│   │   ├── db.ts
│   │   └── settings.ts
│   ├── dispute
│   │   ├── dispute.controller.ts
│   │   ├── dispute.model.ts
│   │   └── dispute.routes.ts
│   ├── env.d.ts
│   ├── express.d.ts
│   ├── init.ts
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
│   ├── release_funds.html
│   └── verification_email.html
└── tsconfig.json

17 directories, 82 files
```