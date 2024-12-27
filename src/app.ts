import express, { type NextFunction, type Express, type Request, type Response } from "express";
import cors, { type CorsOptions } from "cors";
import helmet from "helmet";
import compression from "compression";
import ExpressMongoSanitize from "express-mongo-sanitize";
import { IAppConfig } from "./config/app.config";
import DB from "./config/db";
import AuthMiddleware from "./middlewares/auth.middlewares";
import auth from "./auth/auth.routes";
import bid from "./bid/bid.routes";
import dispute from "./dispute/dispute.routes";
import notification from "./notification/notification.routes";
import deals from "./payment/deals.routes";
import payment from "./payment/payment.routes";
import WebhookController from "./payment/webhook.controller";
import product from "./product/product.routes";
import user from "./user/user.routes";
import { cfg } from "./init";

const API_VERSION = "api/v1";

class App {
    
    private app: Express;
    public readonly cfg: IAppConfig;
    private corsOptions: CorsOptions = {
        origin: process.env.CORS_ORIGIN,
        methods: "GET",
        allowedHeaders: ["Authorization"],
        credentials: true
    }

    constructor() {
        this.app = express();
        this.cfg = cfg;
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandlers();
    }

    private initializeMiddlewares() {
        this.app.use(compression());
        this.app.use(helmet());
        this.app.use(cors(this.corsOptions));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(ExpressMongoSanitize());
    }
    private initializeRoutes() {
        this.app.use(`/${API_VERSION}/auth`, auth);
        this.app.use(`/${API_VERSION}/users`, AuthMiddleware.requireAuth, user);
        this.app.use(`/${API_VERSION}/products`, AuthMiddleware.requireAuth, product);
        this.app.use(`/${API_VERSION}/payments`, AuthMiddleware.requireAuth, payment);
        this.app.use(`/${API_VERSION}/deals`, AuthMiddleware.requireAuth, deals);
        this.app.use(`/${API_VERSION}/bids`, AuthMiddleware.requireAuth, bid);
        this.app.use(`/${API_VERSION}/notifications`, AuthMiddleware.requireAuth, notification);
        this.app.use(`/${API_VERSION}/disputes`, AuthMiddleware.requireAuth, dispute);
        this.app.post('/webhooks', WebhookController.confirm);
        this.app.get("/healthz", (_req: Request, res: Response) => {
            res.status(200).json({ active: "The hood is up commandliner⚡" });
        });;
    }
    private initializeErrorHandlers() {
        this.app.use((_req: Request, res: Response, _next: NextFunction) => {
            console.log("A fatal error occured");
            return res.status(500).json({ error: true, message: "An  error occured\n" });
        });
    }

    public async start() {
        try {

            await DB.connect();


            this.app.listen(cfg.PORT, () => console.log(`Server is up and running on PORT ${cfg.PORT}`));
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    }

}


export default App;