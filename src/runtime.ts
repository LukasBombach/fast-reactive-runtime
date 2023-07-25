type Reaction<V = void> = (current: V | undefined) => V;

export function createReactiveRuntime() {
  const queue = new Set<Reaction>();
  let current: Reaction<any> = () => {};

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

  function react<V = void>(reaction: Reaction<V>): () => V {
    const [get, set] = value(reaction(undefined));
    const previous = current;
    current = reaction;
    // todo prevent infinite loops
    set(reaction(get()));
    current = previous;
    return get;
  }

  return {
    value,
    react,
  };
}
