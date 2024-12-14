import express, { type Request, type Response, type NextFunction } from "express";
import auth from "./auth/auth.routes";
import user from "./user/user.routes";
import DB from "./config/db";
import Settings from "./config/settings";
import product from "./product/product.routes";
import AuthMiddleware from "./middlewares/auth.middlewares";
import cors, { type CorsOptions } from "cors";
import bid from "./bid/bid.routes";
import helmet from "helmet";
import payment from "./payment/payment.routes";
import compression from "compression";
import WebhookController from "./payment/webhook.controller";
import dispute from "./dispute/dispute.routes";
import deals from "./payment/deals.routes";


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
 app.use(`/${API_VERSION}/payments`, AuthMiddleware.requireAuth, payment);
 app.use(`/${API_VERSION}/deals`, AuthMiddleware.requireAuth, deals);
 app.use(`/${API_VERSION}/bids`, AuthMiddleware.requireAuth, bid);
 app.use(`/${API_VERSION}/disputes`, AuthMiddleware.requireAuth, dispute);
 app.post('/webhooks', WebhookController.confirm);
 app.get("/healthz", (_req: Request, res: Response) => {
     res.status(200).json({ active: "The hood is up commandliner⚡" });
 });
app.use((_req: Request, res: Response, _next: NextFunction) => {
    console.log("A fatal error occured" );
    
    return res.status(500).json({ error: true, message: "An  error occured" });
})

DB.connect()
    .then(() => app.listen(PORT, () => console.log("Server is up and running on PORT " + PORT)))
    .catch((error) => console.error({ error }));


export default app;
