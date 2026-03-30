import { io } from "socket.io-client";

// In a real app, you might want to only initialize this when authenticated,
// but for simplicity we initialize it and rely on backend auth checks on upgrade.
export const socket = io(window.location.origin, {
  path: "/socket.io",
  autoConnect: false,
  withCredentials: true,
});
