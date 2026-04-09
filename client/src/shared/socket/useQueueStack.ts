import { useCallback, useEffect, useRef } from "react";

interface UseQueueStackOptions<T> {
  onDequeue: (item: T) => void;
  intervalMs?: number;
}

export const useQueueStack = <T>({
  onDequeue,
  intervalMs = 300,
}: UseQueueStackOptions<T>) => {
  const queueRef = useRef<T[]>([]);
  const isConsumingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDequeueRef = useRef(onDequeue);

  useEffect(() => {
    onDequeueRef.current = onDequeue;
  }, [onDequeue]);

  const enqueue = useCallback(
    (item: T) => {
      queueRef.current.push(item);

      if (isConsumingRef.current) {
        return;
      }

      isConsumingRef.current = true;
      const consumeNext = () => {
        const nextItem = queueRef.current.shift();
        if (!nextItem) {
          isConsumingRef.current = false;
          return;
        }

        onDequeueRef.current(nextItem);
        timeoutRef.current = setTimeout(consumeNext, intervalMs);
      };

      consumeNext();
    },
    [intervalMs],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      queueRef.current = [];
      isConsumingRef.current = false;
    };
  }, []);

  return { enqueue };
};
