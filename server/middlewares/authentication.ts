import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

import User from "../Modals/user";
interface TokenPayload extends JwtPayload {
    userId: string;
    deviceId?: string;
}

class AuthMiddleware {
    private readonly SECRET_KEY: string;

    constructor() {
        if (!process.env.SECRET_KEY) {
            throw new Error("SECRET_KEY is not defined in environment variables.");
        }

        this.SECRET_KEY = process.env.SECRET_KEY;
    }

    public authenticate = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            let token = req.cookies.token as string | undefined;

            if (!token && req.headers.authorization) {
                const authHeader = req.headers.authorization;

                if (authHeader.startsWith("Bearer ")) {
                    token = authHeader.slice(7);
                }
            }

            if (!token) {
                res.status(401).json({
                    message: "Unauthorized - No token",
                });
                return;
            }

            const decoded = jwt.verify(
                token,
                this.SECRET_KEY
            ) as TokenPayload;

            const user = await User.findById(decoded.userId);

            if (!user) {
                res.status(401).json({
                    message: "Invalid token",
                });
                return;
            }

            if (user.isBlocked) {
                res.status(403).json({
                    message: "Your account has been blocked",
                });
                return;
            }

            const deviceId =
                (req.get("X-Device-ID") as string | undefined) ??
                (req.cookies.deviceId as string | undefined);

            if (
                decoded.deviceId &&
                (!deviceId || deviceId !== decoded.deviceId)
            ) {
                res.status(401).json({
                    message:
                        "Session invalid. Please login again.",
                });
                return;
            }

            req.user = user;

            next();
        } catch (error) {
            res.status(401).json({
                message: "Unauthorized - Invalid token",
            });
        }
    };
}

export default new AuthMiddleware();