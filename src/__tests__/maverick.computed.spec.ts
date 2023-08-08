import { createReactiveRuntime } from "../runtime";

const { computed, value } = createReactiveRuntime();

test("it should store and return value on read", () => {
  const [$a] = value(10);
  const [$b] = value(10);
  const $c = computed(() => $a() + $b());

  expect($c()).toBe(20);

  // Try again to ensure state is maintained.
  expect($c()).toBe(20);
});

test("it should update when dependency is updated", () => {
  const [$a, $set_a] = value(10);
  const [$b, $set_b] = value(10);
  const $c = computed(() => $a() + $b());

  $set_a(20);
  expect($c()).toBe(30);

  $set_b(20);
  expect($c()).toBe(40);
});

test("it should update when deep dependency is updated", () => {
  const [$a, $set_a] = value(10);
  const [$b] = value(10);
  const $c = computed(() => $a() + $b());
  const $d = computed(() => $c());

  $set_a(20);
  expect($d()).toBe(30);
});

test("it should update when deep computed dependency is updated", () => {
  const [$a, $set_a] = value(10);
  const [$b, $set_b] = value(10);
  const $c = computed(() => $a() + $b());
  const $d = computed(() => $c());
  const $e = computed(() => $d());

  $set_a(20);
  expect($e()).toBe(30);
});

test("it should only re-compute when needed", () => {
  const compute = jest.fn();

  const [$a, $set_a] = value(10);
  const [$b, $set_b] = value(10);
  const $c = computed(() => compute($a() + $b()));

  expect(compute).not.toHaveBeenCalled();

  $c();
  expect(compute).toHaveBeenCalledTimes(1);
  expect(compute).toHaveBeenCalledWith(20);

  $c();
  expect(compute).toHaveBeenCalledTimes(1);

  $set_a(20);
  $c();
  expect(compute).toHaveBeenCalledTimes(2);

  $set_b(20);
  $c();
  expect(compute).toHaveBeenCalledTimes(3);

  $c();
  expect(compute).toHaveBeenCalledTimes(3);
});

xtest("it should only re-compute whats needed", () => {
  const computeC = jest.fn();
  const computeD = jest.fn();

  const [$a, $set_a] = value(10);
  const [$b, $set_b] = value(10);
  const $c = computed(() => {
    const a = $a();
    computeC(a);
    return a;
  });
  const $d = computed(() => {
    const b = $b();
    computeD(b);
    return b;
  });
  const $e = computed(() => ($c() || 0) + ($d() || 0));

  expect(computeC).not.toHaveBeenCalled();
  expect(computeD).not.toHaveBeenCalled();

  $e();
  expect(computeC).toHaveBeenCalledTimes(1);
  expect(computeD).toHaveBeenCalledTimes(1);
  expect($e()).toBe(20);

  $set_a(20);

  $e();
  expect(computeC).toHaveBeenCalledTimes(2);
  expect(computeD).toHaveBeenCalledTimes(1);
  expect($e()).toBe(30);

  $set_b(20);

  $e();
  expect(computeC).toHaveBeenCalledTimes(2);
  expect(computeD).toHaveBeenCalledTimes(2);
  expect($e()).toBe(40);
});

test("it should discover new dependencies", () => {
  const [$a, $set_a] = value(1, { name: "a" });
  const [$b, $set_b] = value(0, { name: "b" });

  const $c = computed(
    () => {
      if ($a()) {
        return $a();
      } else {
        return $b();
      }
    },
    { name: "c" }
  );

  expect($c()).toBe(1);

  $set_a(0);

  expect($c()).toBe(0);

  $set_b(10);

  expect($c()).toBe(10);
});
