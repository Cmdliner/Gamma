import { Router } from "express";
import FincraService from "./fincra.service";

const router = Router();

router.get("/business-info", FincraService.getBusinessInfo);


export default router;