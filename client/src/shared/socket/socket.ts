import { io, Socket } from "socket.io-client";
import type { Namespace } from "./namespaces";

const socketsByNamespace = new Map<string, Socket>();
let baseUrl: string | null = null;

const buildUrl = (url: string, namespace: Namespace): string => {
    // socket.io-client는 URL 끝의 namespace path를 자동 인식
    if (namespace === "/") return url;
    return `${url}${namespace}`;
};

export const getSocket = (url: string, namespace: Namespace = "/"): Socket => {
    baseUrl = url;
    const cached = socketsByNamespace.get(namespace);
    if (cached) return cached;

    const socket = io(buildUrl(url, namespace), {
        transports: ["websocket"],
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        withCredentials: true,
    });
    socketsByNamespace.set(namespace, socket);
    return socket;
};

export const disposeSocket = (): void => {
    for (const socket of socketsByNamespace.values()) {
        socket.disconnect();
    }
    socketsByNamespace.clear();
    baseUrl = null;
};

export const getBaseUrl = (): string | null => baseUrl;
