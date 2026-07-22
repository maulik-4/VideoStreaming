/**
 * ============================================================================
 * Types Used
 * ============================================================================
 * Schema
 * model
 * Types.ObjectId
 * HydratedDocument
 * Model
 *
 * Interfaces
 * ============================================================================
 * IHistory
 * IHistoryMethods
 * HistoryModel
 * HistoryDocument
 *
 * Future PostgreSQL Changes
 * ============================================================================
 * This model will map almost 1:1 into a Prisma schema.
 * Only the Mongoose-specific methods and virtuals will become service methods.
 * ============================================================================
 */

import {
    Schema,
    model,
    Types,
    HydratedDocument,
    Model,
} from "mongoose";
import type { UserDocument } from "../Modals/user";
export type PlatformType = "local" | "youtube";

export interface IHistory {
    user: Types.ObjectId;

    platform: PlatformType;

    videoId: string;

    title: string;

    thumbnail: string;

    channelName: string;

    uploadedBy?: Types.ObjectId;

    progress: number;

    duration: number;

    firstWatchedAt: Date;

    watchedAt: Date;

    completed: boolean;

    watchCount: number;

    createdAt: Date;

    updatedAt: Date;
}

export interface IHistoryMethods {
    updateCompletionStatus(): boolean;
}

export interface HistoryModel
    extends Model<IHistory, {}, IHistoryMethods> {
    cleanOldHistory(
        userId: Types.ObjectId,
        limit?: number
    ): Promise<number>;
}

export type HistoryDocument = HydratedDocument<
    IHistory,
    IHistoryMethods
>;

const historySchema = new Schema<
    IHistory,
    HistoryModel,
    IHistoryMethods
>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        platform: {
            type: String,
            enum: ["local", "youtube"],
            required: true,
            default: "local",
        },

        videoId: {
            type: String,
            required: true,
            trim: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        thumbnail: {
            type: String,
            required: true,
        },

        channelName: {
            type: String,
            required: true,
            trim: true,
        },

        uploadedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },

        progress: {
            type: Number,
            default: 0,
            min: 0,
        },

        duration: {
            type: Number,
            default: 0,
            min: 0,
        },

        firstWatchedAt: {
            type: Date,
            default: Date.now,
        },

        watchedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },

        completed: {
            type: Boolean,
            default: false,
        },

        watchCount: {
            type: Number,
            default: 1,
            min: 1,
        },
    },
    {
        timestamps: true,
    }
);

/**
 * Compound Unique Index
 */
historySchema.index(
    {
        user: 1,
        videoId: 1,
        platform: 1,
    },
    {
        unique: true,
    }
);

/**
 * Pagination Index
 */
historySchema.index({
    user: 1,
    watchedAt: -1,
});

/**
 * Virtual Property
 */
historySchema.virtual("watchPercentage").get(function () {
    if (this.duration <= 0) return 0;

    return Math.min(
        100,
        Math.round((this.progress / this.duration) * 100)
    );
});

/**
 * Instance Method
 */
historySchema.method(
    "updateCompletionStatus",
    function (): boolean {
        this.completed =
            this.duration > 0 &&
            this.progress >= this.duration * 0.9;

        return this.completed;
    }
);

/**
 * Static Method
 */
historySchema.static(
    "cleanOldHistory",
    async function (
        userId: Types.ObjectId,
        limit = 100
    ): Promise<number> {
        try {
            const historyToDelete = await this.find({
                user: userId,
            })
                .sort({
                    watchedAt: -1,
                })
                .skip(limit)
                .select("_id");

            if (!historyToDelete.length) {
                return 0;
            }

            const ids = historyToDelete.map(
                (history) => history._id
            );

            await this.deleteMany({
                _id: {
                    $in: ids,
                },
            });

            return ids.length;
        } catch {
            return 0;
        }
    }
);

const History = model<
    IHistory,
    HistoryModel
>("History", historySchema);

export default History;