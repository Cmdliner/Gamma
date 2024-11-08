import express, { type Request, type Response, type NextFunction } from "express";
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
import transaction from "./payment/payment.routes";
import compression from "compression";
import WebhookController from "./payment/webhook.controller";


const { PORT, API_VERSION } = Settings;
const corsOptions: CorsOptions = {
    origin: process.env.CORS_ORIGIN,
    methods: "GET",
    allowedHeaders: ["Authorization"],
    credentials: true
}

const app = express();

 app.use(compression());
 app.use(helmet());
 app.use(cors(corsOptions));
 app.use(express.json());
 app.use(express.urlencoded({ extended: true }));
 app.use(`/${API_VERSION}/auth`, auth);
 app.use(`/${API_VERSION}/users`, AuthMiddleware.requireAuth, user);
 app.use(`/${API_VERSION}/products`, AuthMiddleware.requireAuth, product);
 app.use(`/${API_VERSION}/payments`, AuthMiddleware.requireAuth, transaction);
 app.use(`/${API_VERSION}/bids`, AuthMiddleware.requireAuth, bid);
 app.use(`/${API_VERSION}/docs`, SwaggerUI.serve, SwaggerUI.setup(swaggerSpec));
 app.post('/webhooks', WebhookController.confirm);
 app.get("/healthz", (_req: Request, res: Response) => {
     res.status(200).json({ active: "The hood is up commandliner⚡" });
 });
app.use((_req: Request, res: Response, next: NextFunction) => {
    console.log("A fatal error occured" );
    return res.status(500).json({ error: true, message: "An  error occured" });
})

DB.connect()
    .then(() => app.listen(PORT, () => console.log("Server is up and running on PORT " + PORT)))
    .catch((error) => console.error({ error: (error as Error).name }));


export default app;
