const serverProcess = [{
  name: "app_server", // Express server
  interpreter: "bun",
  script: "src/server.ts",
  watch: false,
  env: {
    NODE_ENV: "production",
  }
}]

const workerProcesses = [{
  name: "review_worker", // BullMQ worker for product reviews
  interpreter: "bun",
  script: "src/workers/product.worker.ts",
  watch: false,
  env: {
    NODE_ENV: "production",
  }
},
{
  name: "bid_worker", // BullMQ worker for bid expiry
  script: "src/workers/bid.worker.ts",
  watch: false,
  env: {
    NODE_ENV: "production",
  }
},
{
  name: "payment_worker", // BullMQ worker for payment
  script: "src/workers/payment.worker.ts",
  watch: false,
  env: {
    NODE_ENV: "production",
  },
}
];

module.exports = {
  apps: process.env.BUILD_ARTIFACT === 'server' ? serverProcess : workerProcesses,
};
