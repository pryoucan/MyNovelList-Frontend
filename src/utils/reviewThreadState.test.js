import test from "node:test";
import assert from "node:assert/strict";
import { appendThreadReply, mapThreadItem } from "./reviewThreadState.js";

test("adds a nested reply under its parent", () => {
  const original = [{ id: "review", replies: [{ id: "parent", children: [] }] }];
  const result = appendThreadReply(original, "review", "parent", { id: "child", children: [] });
  assert.equal(result[0].replies[0].children[0].id, "child");
  assert.equal(original[0].replies[0].children.length, 0);
});

test("updates a nested reply and preserves other thread items", () => {
  const original = [{ id: "review", replies: [{ id: "parent", children: [{ id: "child", likesCount: 0, children: [] }] }] }];
  const result = mapThreadItem(original, "review", "child", (reply) => ({ ...reply, likesCount: 1 }));
  assert.equal(result[0].replies[0].children[0].likesCount, 1);
  assert.equal(original[0].replies[0].children[0].likesCount, 0);
});
