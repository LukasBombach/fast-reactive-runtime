type Effect = () => void;

export function createReactiveRuntime() {
  const queue = new Set<Effect>();
  let current: Effect = () => {};

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

  return {
    value,
    effect,
  };
}
