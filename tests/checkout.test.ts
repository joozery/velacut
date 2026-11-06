import { before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { getCatalog } from "../lib/catalog";
let useCheckoutStore: typeof import("../stores/checkout-store").useCheckoutStore;
import type { EditorDoc } from "../stores/editor-store";

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { value: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value), removeItem: (key: string) => memory.delete(key) }, configurable: true });
before(async () => { ({ useCheckoutStore } = await import("../stores/checkout-store")); });
const doc = (): EditorDoc => ({ skins: getCatalog("mlbb").skins.slice(0, 12).map((s) => s.id), cols: null, template: "a", output: "clean" });
beforeEach(() => { memory.clear(); useCheckoutStore.setState({ balance: 128.5, orders: [] }); });

test("charges exact quote once and reuses the order on retry", () => {
  const first = useCheckoutStore.getState().purchase("mlbb", doc(), 6);
  const second = useCheckoutStore.getState().purchase("mlbb", doc(), 6);
  assert.equal(first.id, second.id);
  assert.equal(useCheckoutStore.getState().balance, 109.9);
  assert.equal(useCheckoutStore.getState().orders.length, 1);
});

test("insufficient balance changes neither balance nor history", () => {
  useCheckoutStore.setState({ balance: 1 });
  assert.throws(() => useCheckoutStore.getState().purchase("mlbb", doc(), 6), /ไม่เพียงพอ/);
  assert.equal(useCheckoutStore.getState().balance, 1);
  assert.deepEqual(useCheckoutStore.getState().orders, []);
});

test("watermarked download remains free with zero coins", () => {
  useCheckoutStore.setState({ balance: 0 });
  const order = useCheckoutStore.getState().purchase("mlbb", { ...doc(), output: "watermark" }, 6);
  assert.equal(order.amount, 0);
  assert.equal(useCheckoutStore.getState().balance, 0);
});

test("invalid skin IDs do not create an order", () => {
  const invalid = doc(); invalid.skins[0] = "missing";
  assert.throws(() => useCheckoutStore.getState().purchase("mlbb", invalid, 6));
  assert.equal(useCheckoutStore.getState().balance, 128.5);
  assert.equal(useCheckoutStore.getState().orders.length, 0);
});

test("receipt keeps the paid design even after the editor changes", () => {
  const design = doc();
  const order = useCheckoutStore.getState().purchase("mlbb", design, 6);
  design.skins.reverse();
  assert.notDeepEqual(order.doc.skins, design.skins);
});

test("balance and receipts persist for the next visit", () => {
  const order = useCheckoutStore.getState().purchase("mlbb", doc(), 6);
  const saved = JSON.parse(memory.get("velacut-demo-checkout")!);
  assert.equal(saved.state.balance, 109.9);
  assert.equal(saved.state.orders[0].id, order.id);
});
