"use client";

import { useEffect } from "react";
import { useSocketByNamespace } from "./useSocket";
import { eNamespace } from "./namespaces";
import type { Namespace } from "./namespaces";

interface iUseSocketEvent {
    event: string;
    handler: (data: unknown) => void;
    namespace?: Namespace;
}

export const useSocketEvent = ({
    event,
    handler,
    namespace = eNamespace.main,
}: iUseSocketEvent) => {
    const socket = useSocketByNamespace(namespace);

    useEffect(() => {
        socket.on(event, handler);
        return () => {
            socket.off(event, handler);
        };
    }, [event, handler, socket]);
};
