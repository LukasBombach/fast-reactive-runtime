import { createReactiveRuntime } from "../runtime";

const { value, react } = createReactiveRuntime();

describe("value", () => {
  test("it should return a getter and setter", () => {
    const [get, set] = value(0);
    expect(get()).toBe(0);
    set(1);
    expect(get()).toBe(1);
    set(2);
    expect(get()).toBe(2);
  });

  test("it should trigger a reaction when the value is set", () => {
    const [get, set] = value(0);
    const reaction = jest.fn(() => get());
    react(reaction);
    set(1);
    expect(reaction).toHaveBeenCalledTimes(2);
  });

  test("it should trigger an a reaction when passing values by reference", () => {
    const [get, set] = value({ a: 0 });
    const reaction = jest.fn(() => get());
    react(reaction);
    set({ a: 1 });
    expect(reaction).toHaveBeenCalledTimes(2);
  });

  test("a reaction can be triggered multiple times", () => {
    const [get, set] = value(0);
    const reaction = jest.fn(() => get());
    react(reaction);
    set(1);
    set(2);
    expect(reaction).toHaveBeenCalledTimes(3);
  });
});
