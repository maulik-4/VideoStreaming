import { Request, Response, NextFunction } from "express";

class AdminMiddleware {
    public checkAdmin = (
        req: Request,
        res: Response,
        next: NextFunction
    ): void => {
        if (!req.user) {
            res.status(401).json({
                message: "Unauthorized",
            });
            return;
        }

        if (req.user.role !== "admin") {
            res.status(403).json({
                message: "Admin access only",
            });
            return;
        }

        next();
    };
}

export default new AdminMiddleware();