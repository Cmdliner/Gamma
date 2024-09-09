import express, { type Request, type Response } from "express";
import cors from "cors";
import { config as envConfig } from "dotenv";
import DB from "./config/db";

envConfig();
const PORT = process.env.PORT || 4000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/healthz", (_req: Request, res: Response) => {
    res.status(200).json({ active: "The hood is up commandliner" });
})


DB.connect()
    .then(() => app.listen(PORT, () => console.log("Server is up and running")))
    .catch((error) => console.error({ error: (error as Error).stack }));
