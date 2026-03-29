/**
 * @module hooks/useSocket
 * @description Custom hook that manages a Socket.IO connection to the backend.
 * Automatically connects on mount and disconnects on unmount.
 * Re-creates the connection when the auth token changes.
 */

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { SERVER_URL } from "../api";

/**
 * Establishes and returns a Socket.IO client instance.
 * @param token - JWT token sent via socket handshake auth (nullable for anonymous users).
 */
export function useSocket(token: string | null): Socket | undefined {
  const [socket, setSocket] = useState<Socket>();

  useEffect(() => {
    const s = io(SERVER_URL, {
      auth: { token },
      transports: ["polling", "websocket"],
      upgrade: true,
    });
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [token]);

  return socket;
}
