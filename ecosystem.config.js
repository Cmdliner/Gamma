const serverProcess = [{
  name: "oyeah_server", // Express server
  interpreter: "bun",
  script: "dist/server.js",
  watch: false,
  env: {
    NODE_ENV: "production",
  }
}]

const workerProcesses = [{
  name: "review_worker", // BullMQ worker for product reviews
  interpreter: "bun",
  script: "dist/workers/product.worker.js",
  watch: false,
  env: {
    NODE_ENV: "production",
  }
},
{
  name: "bid_worker", // BullMQ worker for bid expiry
  script: "dist/workers/bid.worker.js",
  watch: false,
  env: {
    NODE_ENV: "production",
  }
},
{
  name: "payment_worker", // BullMQ worker for payment
  script: "dist/workers/payment.worker.js",
  watch: false,
  env: {
    NODE_ENV: "production",
  },
}
];

module.exports = {
  apps: process.env.BUILD_ARTIFACT === 'server' ? serverProcess : workerProcesses,
};
