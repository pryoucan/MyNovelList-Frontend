// Only complete ||pairs|| become spoilers. Unmatched pipes stay visible text.
export const splitSpoilers = (body) => {
  const parts = [];
  const pattern = /\|\|([\s\S]+?)\|\|/g;
  let start = 0;
  for (const match of body.matchAll(pattern)) {
    if (match.index > start) parts.push({ text: body.slice(start, match.index), spoiler: false });
    parts.push({ text: match[1], spoiler: true });
    start = match.index + match[0].length;
  }
  if (start < body.length) parts.push({ text: body.slice(start), spoiler: false });
  return parts;
};
