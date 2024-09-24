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

- validation does not catch "allowed values" errors in products upload

## TODOS
- Write middleware to validate uploads (check that file is a valid image)
- use express req compressor middleware (gzipped)
- Check uniqueness of phone numbers on registering and handle errors appropriately
- implement rate limiting for reset-password and verify-bvn endpoints
- implement product limiting (pagination) that can be consumed by infinite scrolling by the frontend
- implement compression for endpoints with large data sets
- implement referrals
- delete product (if no current operation is pending) [X]
- create disputes
- Create bids [X]
- Create product status ("available", "pending", "sold") [X]
- Sponsor product: implement this as a flag in product (e.g is_sponsored: true or false) [X]
- user search history (recent searchs for products)
- Notifications -> bid info, payment, updates (Any product / transaction related event)
- App pays them through escrow account
- Users put money in app by bank account or card
- On bid accepted 5 mins payment time before expiry [X]
- On buyer payment create transaction receipts with method of payment and transaction id
- Create notification model
- Implement push-notifications with appropraitely named lib
- Add push token to user model
- Uniqueness of referral token should be implemented in the controller as business logic

## REMEMBER
- Create referrals in user model
- Create referral token by default on user model so it would be unique and will never be null.
- Cannot accept multiple bids on same product item
- Image upload bug is caused by improper disk storage configuration
- change min limit for images in products validation for all from 1 to 10

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
