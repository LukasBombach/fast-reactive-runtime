type Reaction = () => void;

export function createReactiveRuntime() {
  const queue = new Set<Reaction>();
  let current: Reaction = () => {};

  function value<V>(value: V): [get: () => V, set: (value: V) => void] {
    const reactions = new Set<Reaction>();

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

  function react(reaction: Reaction) {
    const previous = current;
    current = reaction;
    reaction();
    current = previous;
  }

  return {
    value,
    react,
  };
}
