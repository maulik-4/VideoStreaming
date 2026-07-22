/**
 * ============================================================================
 * Types Used
 * ============================================================================
 * Schema
 * Model
 * HydratedDocument
 * Types.ObjectId
 *
 * Interface
 * ============================================================================
 * IUser
 *
 * Future PostgreSQL Changes
 * ============================================================================
 * This interface will be reused almost entirely in Prisma.
 * Only the schema definition will change.
 * ============================================================================
 */

import {
    Schema,
    model,
    HydratedDocument,
    Types
} from "mongoose";

export interface IUser {
    channelName: string;
    userName: string;
    password: string;
    about: string;
    profilePic: string;

    role: "user" | "admin";

    isBlocked: boolean;

    subscriptions: Types.ObjectId[];

    subscribersCount: number;

    createdAt: Date;
    updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
    {
        channelName: {
            type: String,
            required: true,
            trim: true,
        },

        userName: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },

        about: {
            type: String,
            required: true,
            trim: true,
        },

        profilePic: {
            type: String,
            required: true,
            default: "https://via.placeholder.com/150",
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },

        isBlocked: {
            type: Boolean,
            default: false,
        },

        subscriptions: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        subscribersCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);
import { Model } from "mongoose";

const User = model<IUser>(
    "User",
    userSchema
) as Model<IUser>;

export default User;