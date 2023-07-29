type Effect = () => void;
type Computed<T> = (current: T | undefined) => T;

const noop = () => {};

export function createReactiveRuntime() {
  const queue = new Set<Effect>();

  // This is the current effect that is being executed
  let current: (...args: any[]) => any = noop;

  function value<V>(value: V): [get: () => V, set: (value: V) => void] {
    const reactions = new Set<Effect>();

    // Every time we call get, we add the current effect to the reactions
    // This makes a reaction that includes a getter a dependency of that value
    const get = () => {
      reactions.add(current);
      return value;
    };

    // Every time we call set, we execute all the reactions
    // that have been added to its as a dependency
    // Instead of directly executing the reactions, we add them to the queue
    // so that when there are nested calls to set, we don't execute the reactions
    // until the outermost call to set is finished
    // The is the equivalent of batching the reactions in a single tick
    // or in other words, we work trough a call tree depth first
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
    // We assign effect to the current effect
    // so that when we call get on a value, we can add the current effect
    // to the reactions of that value
    const previous = current;
    current = fn;
    fn();
    current = previous;
  }

  function computed<T = undefined>(fn: Computed<T>): () => T {
    const [get, set] = value<T>(fn(undefined));

    // we create an effect that uses the setter of the value
    // so that when the value is changed, the effect is executed
    // but we must make sure that we do not a create a circular dependency
    // so we use a flag to check if the effect is already being executed
    let isComputing = false;
    effect(() => {
      if (isComputing) return;
      isComputing = true;
      set(fn(get()));
      isComputing = false;
    });

    return get;
  }

  return {
    value,
    effect,
    computed,
  };
}
