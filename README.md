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


## TODOS
- Payment to wallet when buying
- deals (pending, accepted )
- Sanitize inputs for all actions (impl max char length, rm whitespace, dont allow special characters)
- Notifications -> bid info, payment, updates (Any product / transaction related event)
- On buyer payment create transaction receipts with method of payment and transaction id


## REMEMBER
- Upload can only error due to client-side errors; upload middleware is very stable
- Implement https
- Create referrals in user model
- Create referral token by default on user model so it would be unique and will never be null.
- Cannot accept multiple bids on same product item
- change min limit for images in products validation for all from 1 to 10
- change ref to uppercase collection name when trying to ref sub_docs in a new model

## Project structure

```sh
.
├── admin
├── bun.lockb
├── Dockerfile
├── docs
│   ├── auth
│   │   └── register.yaml
│   └── healthz.yaml
├── monoService.js
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
│   │   └── auth.routes.ts
│   ├── bid
│   │   ├── bid.controller.ts
│   │   ├── bid.model.ts
│   │   └── bid.routes.ts
│   ├── config
│   │   ├── db.ts
│   │   ├── settings.ts
│   │   └── swagger.ts
│   ├── emails
│   │   └── email.service.ts
│   ├── env.d.ts
│   ├── express.d.ts
│   ├── lib
│   │   ├── main.ts
│   │   └── otp.ts
│   ├── middlewares
│   │   ├── auth.middlewares.ts
│   │   └── upload.middlewares.ts
│   ├── monoService.ts
│   ├── product
│   │   ├── product.controller.ts
│   │   ├── product.model.ts
│   │   └── product.routes.ts
│   ├── __tests__
│   │   └── auth.test.ts
│   ├── types
│   │   ├── bid.schema.ts
│   │   ├── electronics.schema.ts
│   │   ├── gadget.schema.ts
│   │   ├── generic.schema.ts
│   │   ├── landed_property.schema.ts
│   │   ├── multer_file.ts
│   │   ├── otp.schema.ts
│   │   ├── phone_number.schema.ts
│   │   ├── product.dto.ts
│   │   ├── product.schema.ts
│   │   ├── user.dto.ts
│   │   ├── user.schema.ts
│   │   └── vehicle.schema.ts
│   ├── user
│   │   ├── user.controller.ts
│   │   ├── user.model.ts
│   │   └── user.routes.ts
│   └── validations
│       ├── auth.validation.ts
│       └── product.validation.ts
├── templates
│   ├── password_reset.html
│   └── verification_email.html
└── tsconfig.json

18 directories, 52 files
```
