import express, { type Request, type Response } from "express";
import auth from "./auth/auth.routes";
import DB from "./config/db";
import Settings from "./config/settings";
import SwaggerUI from "swagger-ui-express";
import product from "./product/product.routes";
import AuthMiddleware from "./middlewares/auth.middlewares";
import swaggerSpec from "./config/swagger";
import cors, { CorsOptions } from "cors";

const { PORT, API_VERSION } = Settings;
const app = express();
const corsOptions: CorsOptions = {
    origin: "http://localhost:5500",
    methods: "POST",
    allowedHeaders: ["Authorization"],
    credentials: true
}
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(`/${API_VERSION}/docs`, SwaggerUI.serve, SwaggerUI.setup(swaggerSpec));
app.use(`/${API_VERSION}/auth`, auth);
app.use(`/${API_VERSION}/products`, AuthMiddleware.requireAuth, product);

app.get("/healthz", (_req: Request, res: Response) => {
    res.status(200).json({ active: "The hood is up commandliner⚡" });
});

DB.connect()
    .then(() => app.listen(PORT, () => console.log("Server is up and running on PORT " + PORT)))
    .catch((error) => console.error({ error: (error as Error).stack }));


export default app;
