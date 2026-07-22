import { UserDocument } from "../Modals/user";

declare global {
    namespace Express {
        interface Request {
            user: UserDocument;
        }
    }
}

export {};