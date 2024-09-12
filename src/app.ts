import express, { type Request, type Response } from "express";
import { config as envConfig } from "dotenv";
import auth from "./auth/auth.routes";
import DB from "./config/db";
import Settings from "./config/settings";

envConfig();
const { PORT, API_VERSION } = Settings;
const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/healthz", (_req: Request, res: Response) => {
    res.status(200).json({ active: "The hood is up commandliner" });
});
app.use(`/${API_VERSION}/auth`, auth);
app.use(`/${API_VERSION}/products`, auth);


DB.connect()
    .then(() => app.listen(PORT, () => console.log("Server is up and running on PORT " + PORT)))
    .catch((error) => console.error({ error: (error as Error).stack }));


export default app;