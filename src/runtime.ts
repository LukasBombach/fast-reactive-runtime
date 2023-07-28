type Effect = () => void;
type Computed<T> = (current: T | undefined) => T;

export function createReactiveRuntime() {
  const queue = new Set<Effect>();
  let current: (...args: any[]) => any = () => {};

  function value<V>(value: V): [get: () => V, set: (value: V) => void] {
    const reactions = new Set<Effect>();

    const get = () => {
      reactions.add(current);
      return value;
    };

    const set = (newValue: V) => {
      value = newValue;

      const values = queue.values();
      reactions.forEach(r => queue.add(r));
      let item = values.next();
      while (!item.done) {
        queue.delete(item.value);
        item.value();
        item = values.next();
      }
    };

    return [get, set];
  }

  function effect(fn: Effect) {
    const previous = current;
    current = fn;
    fn();
    current = previous;
  }

  function computed<T = undefined>(fn: Computed<T>): () => T {
    const [get, set] = value<T>(fn(undefined));

    //effect(() => set(fn(get())));

    const previous = current;
    current = fn;
    fn(undefined);
    current = previous;

    return get;

    /* let value: T | undefined = undefined;
    let firstRun = true;

    const get = () => {
      if (firstRun) {
        value = fn(undefined);
        firstRun = false;
      }

      return value!;
    };

    const set = (newValue: T) => {
      value = newValue;
    };

    return get; */
  }

  return {
    value,
    effect,
    computed,
  };
}
