import { createReactiveRuntime } from "../runtime";

const { value, effect: react } = createReactiveRuntime();

describe("value", () => {
  test("it should return a getter and setter", () => {
    const [get, set] = value(0);
    expect(get()).toBe(0);
    set(1);
    expect(get()).toBe(1);
    set(2);
    expect(get()).toBe(2);
  });

  test("it should trigger a effect when the value is set", () => {
    const [get, set] = value(0);
    const effect = jest.fn(() => get());
    react(effect);
    set(1);
    expect(effect).toHaveBeenCalledTimes(2);
  });

  test("it should trigger an a effect when passing values by reference", () => {
    const [get, set] = value({ a: 0 });
    const effect = jest.fn(() => get());
    react(effect);
    set({ a: 1 });
    expect(effect).toHaveBeenCalledTimes(2);
  });

  test("a effect can be triggered multiple times", () => {
    const [get, set] = value(0);
    const effect = jest.fn(() => get());
    react(effect);
    set(1);
    set(2);
    expect(effect).toHaveBeenCalledTimes(3);
  });

  test("a value can trigger multiple effects", () => {
    const [get, set] = value(0);
    const effect1 = jest.fn(() => get());
    const effect2 = jest.fn(() => get());
    react(effect1);
    react(effect2);
    set(1);
    expect(effect1).toHaveBeenCalledTimes(2);
    expect(effect2).toHaveBeenCalledTimes(2);
  });

  test("a effect can be triggered by multiple values", () => {
    const [get1, set1] = value(0);
    const [get2, set2] = value(0);
    const effect = jest.fn(() => [get1(), get2()]);
    react(effect);
    set1(1);
    set2(1);
    expect(effect).toHaveBeenCalledTimes(3);
  });
});
