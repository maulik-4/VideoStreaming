/**
 * ============================================================================
 * Types Used
 * ============================================================================
 * SocketServer - Socket.IO server instance
 *
 * Variables
 * ============================================================================
 * io : SocketServer | null
 *
 * Purpose
 * ============================================================================
 * Stores a singleton Socket.IO instance so it can be accessed throughout the
 * application (e.g., controllers, services).
 *
 * Future PostgreSQL Changes
 * ============================================================================
 * No changes required. This file is database independent.
 * ============================================================================
 */

import { Server as SocketServer } from "socket.io";

let io: SocketServer | null = null;

/**
 * Initialize the Socket.IO instance.
 */
export const setIO = (socketInstance: SocketServer): void => {
    io = socketInstance;
};

/**
 * Retrieve the initialized Socket.IO instance.
 */
export const getIO = (): SocketServer => {
    if (!io) {
        throw new Error("Socket.IO has not been initialized.");
    }

    return io;
};