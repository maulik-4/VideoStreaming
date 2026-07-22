/**
 * ============================================================================
 * Types Used
 * ============================================================================
 * Schema
 * Model
 * Types.ObjectId
 * HydratedDocument
 *
 * Interfaces
 * ============================================================================
 * IComment
 * IVideo
 * VideoDocument
 *
 * Future PostgreSQL Changes
 * ============================================================================
 * Comments should eventually become their own table.
 * Likes should eventually become their own table.
 * This interface can largely be reused with Prisma.
 * ============================================================================
 */

import {
    Schema,
    model,
    Types,
    HydratedDocument,
} from "mongoose";
type CommentDocument = HydratedDocument<IComment>;


/**
 * Embedded Comment
 */
export interface IComment {
    user: Types.ObjectId;
    text: string;
    edited?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
/**
 * Video Interface
 */
export interface IVideo {
    user: Types.ObjectId;

    title: string;

    description?: string;

    videoLink: string;

    thumbnail: string;

    category: string;

    likes: number;

    dislike: number;

    views: number;  

    comments: Types.DocumentArray<CommentDocument>;

    createdAt: Date;

    updatedAt: Date;
}

export type VideoDocument = HydratedDocument<IVideo>;

const commentSchema = new Schema<IComment>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        text: {
            type: String,
            required: true,
            trim: true,
        },

        edited: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const videoSchema = new Schema<IVideo>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            default: "",
            trim: true,
        },

        videoLink: {
            type: String,
            required: true,
        },

        thumbnail: {
            type: String,
            required: true,
        },

        category: {
            type: String,
            required: true,
            default: "All",
        },

        likes: {
            type: Number,
            default: 0,
        },

        dislike: {
            type: Number,
            default: 0,
        },

        views: {
            type: Number,
            default: 0,
        },

        comments: [commentSchema],
    },
    {
        timestamps: true,
    }
);

const Video = model<IVideo>("Video", videoSchema);

export default Video;