import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useLongPressRepeat } from "./use-long-press";

describe("useLongPressRepeat", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test("toque simples não repete, click passa", () => {
    const onRepeat = vi.fn();
    const { result } = renderHook(() => useLongPressRepeat(onRepeat));
    let tapped = 0;
    const click = result.current.guardedClick(() => {
      tapped += 1;
    });
    act(() => {
      result.current.onPointerDown();
    });
    act(() => {
      result.current.onPointerUp();
    });
    click();
    expect(onRepeat).not.toHaveBeenCalled();
    expect(tapped).toBe(1);
  });

  test("segurar repete e consome o click seguinte", () => {
    const onRepeat = vi.fn();
    const { result } = renderHook(() => useLongPressRepeat(onRepeat, 500, 300));
    let tapped = 0;
    const click = result.current.guardedClick(() => {
      tapped += 1;
    });
    act(() => {
      result.current.onPointerDown();
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onRepeat).toHaveBeenCalledTimes(1);
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(onRepeat).toHaveBeenCalledTimes(3);
    act(() => {
      result.current.onPointerUp();
    });
    click();
    expect(tapped).toBe(0);
    click();
    expect(tapped).toBe(1);
  });

  test("soltar antes do delay não repete", () => {
    const onRepeat = vi.fn();
    const { result } = renderHook(() => useLongPressRepeat(onRepeat, 500, 300));
    act(() => {
      result.current.onPointerDown();
    });
    act(() => {
      vi.advanceTimersByTime(499);
      result.current.onPointerUp();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onRepeat).not.toHaveBeenCalled();
  });
});
