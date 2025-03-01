import express, { type NextFunction, type Express, type Request, type Response } from "express";
import cors, { type CorsOptions } from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import ExpressMongoSanitize from "express-mongo-sanitize";
import DB from "./config/db.config";
import AuthMiddleware from "./middlewares/auth.middlewares";
import auth from "./routes/auth.routes";
import bid from "./routes/bid.routes";
import dispute from "./routes/dispute.routes";
import notification from "./routes/notification.routes";
import deals from "./routes/deals.routes";
import payment from "./routes/payment.routes";
import product from "./routes/product.routes";
import user from "./routes/user.routes";
import { cfg } from "./init";
import rateLimit from "express-rate-limit";
import { AppConfig } from "./config/app.config";
import { logger } from "./config/logger.config";
import webhook from "./routes/webhook.routes";

const API_VERSION = "api/v1";

class App {

    private app: Express;
    public readonly cfg: AppConfig;
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
        this.app.set("trust proxy", 1);
        this.app.use(rateLimit({
            windowMs: 10 * 60 * 1000,
            max: 60,
        }));
        this.app.use(compression());
        this.app.use(helmet());
        this.app.use(cors(this.corsOptions));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(ExpressMongoSanitize());
        this.app.use(morgan(':method :url :status :res[content-length] - :response-time ms', {
            stream: {
                write: (message) => logger.http(message.trim())
            }
        }));
    }
    
    private initializeRoutes() {
        this.app.use(`/webhook`, webhook);
        this.app.use(`/${API_VERSION}/auth`, auth);
        this.app.use(`/${API_VERSION}/users`, AuthMiddleware.requireAuth, user);
        this.app.use(`/${API_VERSION}/products`, AuthMiddleware.requireAuth, product);
        this.app.use(`/${API_VERSION}/payments`, AuthMiddleware.requireAuth, payment);
        this.app.use(`/${API_VERSION}/deals`, AuthMiddleware.requireAuth, deals);
        this.app.use(`/${API_VERSION}/bids`, AuthMiddleware.requireAuth, bid);
        this.app.use(`/${API_VERSION}/notifications`, AuthMiddleware.requireAuth, notification);
        this.app.use(`/${API_VERSION}/disputes`, AuthMiddleware.requireAuth, dispute);
        this.app.get("/healthz", (_req: Request, res: Response) => {
            res.status(200).json({ active: "The hood is up commandliner⚡"});
        });
        this.app.get('/', (_req: Request, res: Response) => res.redirect("/healthz"));
    }

    private initializeErrorHandlers() {
        this.app.use((_: Request, res: Response, _next: NextFunction) => {
            logger.error("An error occured");
            return res.status(500).json({ error: true, message: "An  error occured" });
        });
    }

    public async start() {
        try {
            this.app.listen(this.cfg.PORT, () => console.log(`Server is up and running on PORT ${cfg.PORT}`));
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    }

}

export default App;