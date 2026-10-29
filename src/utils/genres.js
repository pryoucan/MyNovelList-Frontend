// Only genres that actually narrow the list: at least 2 novels, and not
// (almost) every novel — "Action" on 6/6 filters nothing.
const MIN_COUNT = 2;
const MAX_SHARE = 0.7;
const MAX_CHIPS = 8;

export const usefulGenres = (novels) => {
  const counts = new Map();
  for (const novel of novels) for (const g of novel.genres ?? []) counts.set(g, (counts.get(g) ?? 0) + 1);
  return [...counts]
    .filter(([, count]) => count >= MIN_COUNT && count / novels.length <= MAX_SHARE)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_CHIPS);
};
