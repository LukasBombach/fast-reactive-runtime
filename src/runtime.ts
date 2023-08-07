import chalk from "chalk";

type Effect = () => void;
type Computed<T> = (current: T | undefined) => T;

const noop = () => {};

export function createReactiveRuntime() {
  const queue = new Set<Effect>();

  // This is the current effect that is being executed
  let current: (...args: any[]) => any = noop;

  function value<V>(value: V, options?: { name: string }): [get: () => V, set: (value: V) => void] {
    const reactions = new Set<Effect>();
    let isSetting = false;

    // Every time we call get, we add the current effect to the reactions
    // This makes a reaction that includes a getter a dependency of that value
    const get = () => {
      // console.log(chalk.green("getting"), chalk.green(options?.name), "current is", current.toString());

      if (isSetting) return value;
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

      isSetting = true;

      const values = queue.values();
      reactions.forEach(r => queue.add(r));
      // console.log(
      //   chalk.yellow("setting"),
      //   chalk.yellow(options?.name),
      //   "reactions:",
      //   [...reactions].map(r => r.toString())
      // );
      let item = values.next();
      while (!item.done) {
        queue.delete(item.value);

        const previous = current;
        // console.log(chalk.blue("setting current"), item.value.toString());
        current = item.value;
        item.value();
        // console.log(chalk.red("restoring current"), previous);
        current = previous;

        item = values.next();
      }

      isSetting = false;
    };

    return [get, set];
  }

  function effect(fn: Effect) {
    // We assign effect to the current effect
    // so that when we call get on a value, we can add the current effect
    // to the reactions of that value
    const previous = current;
    // console.log(chalk.blue("setting current"), fn.toString());
    current = fn;
    fn();
    // console.log(chalk.red("restoring current"), previous);
    current = previous;
  }

  function computed<T = undefined>(fn: Computed<T>, options?: { name: string }): () => T | undefined {
    const [get, set] = value<T | undefined>(undefined, options);

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
