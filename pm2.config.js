module.exports = [
  {
    name: 'gamma_server', // Express server
    interpreter: 'bun',
    script: 'src/server.ts',
    args: '--env-file .env',
    watch: false,
    env: {
      NODE_ENV: 'production',
    },
  },
  {
    name: 'review_worker', // BullMQ worker for product reviews
    interpreter: 'bun',
    script: 'src/workers/product.worker.ts',
    args: '--env-file .env',
    watch: false,
    env: {
      NODE_ENV: 'production',
    },
  },
  {
    name: 'bid_worker', // BullMQ worker for bid expiry
    interpreter: 'bun',
    script: 'src/workers/bid.worker.ts',
    args: '--env-file .env',
    watch: false,
    env: {
      NODE_ENV: 'production',
    },
  },
  {
    name: 'payment_worker', // BullMQ worker for payment
    interpreter: 'bun',
    script: 'src/workers/payment.worker.ts',
    args: '--env-file .env',
    watch: false,
    env: {
      NODE_ENV: 'production',
    },
  },
];
  
