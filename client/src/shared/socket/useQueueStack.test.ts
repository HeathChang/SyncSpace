import { act, renderHook } from "@testing-library/react";
import { useQueueStack } from "./useQueueStack";

describe("useQueueStack", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should consume the first enqueued item immediately", () => {
    const onDequeue = jest.fn();
    const { result } = renderHook(() =>
      useQueueStack<string>({ onDequeue, intervalMs: 100 }),
    );

    act(() => {
      result.current.enqueue("first");
    });

    expect(onDequeue).toHaveBeenCalledTimes(1);
    expect(onDequeue).toHaveBeenCalledWith("first");
  });

  it("should consume subsequent items after the interval", () => {
    const onDequeue = jest.fn();
    const { result } = renderHook(() =>
      useQueueStack<string>({ onDequeue, intervalMs: 100 }),
    );

    act(() => {
      result.current.enqueue("a");
      result.current.enqueue("b");
      result.current.enqueue("c");
    });

    expect(onDequeue).toHaveBeenCalledTimes(1);
    expect(onDequeue).toHaveBeenCalledWith("a");

    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(onDequeue).toHaveBeenCalledTimes(2);
    expect(onDequeue).toHaveBeenLastCalledWith("b");

    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(onDequeue).toHaveBeenCalledTimes(3);
    expect(onDequeue).toHaveBeenLastCalledWith("c");
  });

  it("should preserve FIFO order", () => {
    const calls: number[] = [];
    const onDequeue = (item: number) => calls.push(item);
    const { result } = renderHook(() =>
      useQueueStack<number>({ onDequeue, intervalMs: 50 }),
    );

    act(() => {
      result.current.enqueue(1);
      result.current.enqueue(2);
      result.current.enqueue(3);
    });

    act(() => {
      jest.advanceTimersByTime(50);
    });
    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(calls).toEqual([1, 2, 3]);
  });

  it("should use default intervalMs when not provided", () => {
    const onDequeue = jest.fn();
    const { result } = renderHook(() => useQueueStack<string>({ onDequeue }));

    act(() => {
      result.current.enqueue("a");
      result.current.enqueue("b");
    });

    expect(onDequeue).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(onDequeue).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(onDequeue).toHaveBeenCalledTimes(2);
  });
});
