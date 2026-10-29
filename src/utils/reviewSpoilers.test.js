import test from "node:test";
import assert from "node:assert/strict";
import { splitSpoilers } from "./reviewSpoilers.js";

test("hides only the marked part of a review", () => {
  assert.deepEqual(splitSpoilers("Hi this is a ||spoiler|| and it was ||great||."), [
    { text: "Hi this is a ", spoiler: false },
    { text: "spoiler", spoiler: true },
    { text: " and it was ", spoiler: false },
    { text: "great", spoiler: true },
    { text: ".", spoiler: false },
  ]);
});

test("leaves unmatched delimiters visible", () => {
  assert.deepEqual(splitSpoilers("Hi ||unfinished"), [
    { text: "Hi ||unfinished", spoiler: false },
  ]);
});

test("supports multiline spoilers", () => {
  assert.deepEqual(splitSpoilers("Start ||line one\nline two|| end"), [
    { text: "Start ", spoiler: false },
    { text: "line one\nline two", spoiler: true },
    { text: " end", spoiler: false },
  ]);
});
