import express, { type Request, type Response } from "express";
import auth from "./auth/auth.routes";
import user from "./user/user.routes";
import DB from "./config/db";
import Settings from "./config/settings";
import SwaggerUI from "swagger-ui-express";
import product from "./product/product.routes";
import AuthMiddleware from "./middlewares/auth.middlewares";
import swaggerSpec from "./config/swagger";
import cors, { type CorsOptions } from "cors";
import bid from "./bid/bid.routes";
import helmet from "helmet";
import http2, { SecureServerOptions } from "http2";

const { PORT, API_VERSION } = Settings;
const corsOptions: CorsOptions = {
    origin: process.env.CORS_ORIGIN,
    methods: "POST",
    allowedHeaders: ["Authorization"],
    credentials: true
}
const app = express();

app.use(helmet()); //!TODO => Configure helmet headers
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(`/${API_VERSION}/auth`, auth);
app.use(`/${API_VERSION}/users`, AuthMiddleware.requireAuth, user);
app.use(`/${API_VERSION}/products`, AuthMiddleware.requireAuth, product);
app.use(`/${API_VERSION}/bids`, AuthMiddleware.requireAuth, bid);
app.use(`/${API_VERSION}/docs`, SwaggerUI.serve, SwaggerUI.setup(swaggerSpec));


app.get("/healthz", (_req: Request, res: Response) => {
    res.status(200).json({ active: "The hood is up commandliner⚡" });
});

DB.connect()
    .then(() => app.listen(PORT, () => console.log("Server is up and running on PORT " + PORT)))
    .catch((error) => console.error({ error: (error as Error).name }));


const serverOpts: SecureServerOptions = {
    cert: process.env.SSL_CERT,
    key: process.env.SSL_KEY,
}
const server = http2.createSecureServer(serverOpts);

export default app;