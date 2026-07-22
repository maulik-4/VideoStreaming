import { Router } from "express";

import { getAnalysis } from "../Controllers/analysis";
import authentication from "../middlewares/authentication";

const router = Router();

const auth =
    authentication.authenticate.bind(
        authentication
    );

router.get(
    "/:userId",
    auth,
    getAnalysis
);

export default router;