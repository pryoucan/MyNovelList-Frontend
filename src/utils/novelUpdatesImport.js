// Import a novel from a NovelUpdates series page.
//
// NovelUpdates is behind Cloudflare, so our server can't fetch it. Instead the
// admin opens the page in their own browser and clicks a bookmarklet, which
// reads the page and opens /admin/import#nu=<raw JSON>. Extraction stays dumb
// (just the text of each section); all mapping to our fields happens here, so
// fixing a mapping never requires re-installing the bookmark.
import { ORIGINAL_PUBLISHERS, ENGLISH_PUBLISHERS } from "./novelFields";

export const NU_SEARCH_URL = (query) =>
  `https://www.novelupdates.com/?s=${encodeURIComponent(query)}&post_type=seriesplans`;

// Runs on the NovelUpdates page, not in our app: it must not reference anything
// outside itself, because it is serialized with toString().
function extractNovelUpdates(app) {
  var $ = function (s) { return document.querySelector(s); };
  var text = function (el) { return el ? el.textContent.replace(/\s+/g, " ").trim() : ""; };
  var list = function (s) {
    return Array.prototype.map.call(document.querySelectorAll(s), text).filter(Boolean);
  };
  var lines = function (el) {
    return el ? el.innerText.split("\n").map(function (l) { return l.trim(); }).filter(Boolean) : [];
  };
  if (!/(^|\.)novelupdates\.com$/.test(location.hostname) || !$(".seriestitlenu")) {
    alert("Open a NovelUpdates series page first, then click this bookmark.");
    return;
  }
  var img = $(".seriesimg img") || $(".serieseditimg img");
  var data = {
    url: location.origin + location.pathname,
    title: text($(".seriestitlenu")),
    cover: img ? img.src : "",
    associated: lines($("#editassociated")),
    authors: list("#showauthors a").length ? list("#showauthors a") : lines($("#showauthors")),
    type: text($("#showtype")),
    language: text($("#showlang")),
    year: text($("#edityear")),
    status: lines($("#editstatus")).join(" "),
    translated: text($("#showtranslated")),
    publisherOriginal: list("#showopublisher a").length ? list("#showopublisher a") : lines($("#showopublisher")),
    publisherEnglish: list("#showepublisher a").length ? list("#showepublisher a") : lines($("#showepublisher")),
    genres: list("#seriesgenre a"),
    tags: list("#showtags a"),
    description: ($("#editdescription") || { innerText: "" }).innerText.trim(),
  };
  window.open(app + "/admin/import#nu=" + encodeURIComponent(JSON.stringify(data)), "_blank");
}

export const bookmarkletHref = (appOrigin) =>
  "javascript:" + encodeURIComponent(`(${extractNovelUpdates.toString()})(${JSON.stringify(appOrigin)})`);

// Reads the bookmarklet payload from the URL hash (or null).
export const readImportHash = (hash) => {
  const match = /^#nu=(.+)$/.exec(hash);
  if (!match) return null;
  try {
    const raw = JSON.parse(decodeURIComponent(match[1]));
    return raw && typeof raw === "object" && typeof raw.title === "string" ? raw : null;
  } catch {
    return null;
  }
};

// ── Mapping ──

const CJK = /[぀-ヿ㐀-鿿가-힯]/;
const HAN = /[㐀-鿿]/;
const MAX_GENRES = 12;
const MAX_TAGS = 100;
const MAX_YEAR = new Date().getFullYear() + 2;

const LANGUAGES = { chinese: "zh", english: "en" };

// NovelUpdates status (in parentheses) → our publication status.
const STATUSES = [
  [/complete/i, "Completed"],
  [/ongoing/i, "Ongoing"],
  [/hiatus/i, "On Hiatus"],
  [/drop|cancel|discontinu/i, "Cancelled"],
  [/upcoming|not yet/i, "Upcoming"],
];

// Names NovelUpdates uses for the publishers we support.
const PUBLISHER_ALIASES = {
  Qidian: ["qidian", "起点"],
  Zongheng: ["zongheng", "纵横"],
  Jinjiang: ["jinjiang", "jjwxc", "晋江"],
  "17K": ["17k"],
  Wuxiaworld: ["wuxiaworld"],
  "Web Novel": ["webnovel", "qidianinternational"],
};

const squash = (s) => s.toLowerCase().replace(/[^a-z0-9㐀-鿿]/g, "");

const matchPublisher = (names, allowed) => {
  for (const name of names) {
    const key = squash(name);
    const hit = allowed.find((p) => PUBLISHER_ALIASES[p].some((alias) => key.includes(alias)));
    if (hit) return hit;
  }
  return null;
};

const titleCase = (s) => s.trim().replace(/\s+/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// Raw bookmarklet data → { novel (API shape, as NovelForm expects), notes }.
// `notes` lists what the admin should check: [{ field, message }].
export const mapNovelUpdates = (raw) => {
  const notes = [];
  const note = (field, message) => notes.push({ field, message });
  const strings = (v) => (Array.isArray(v) ? v.filter((s) => typeof s === "string" && s.trim()) : []);

  // Original title: prefer a Chinese-character name for Chinese novels.
  const language = LANGUAGES[(raw.language ?? "").trim().toLowerCase()] ?? null;
  const associated = strings(raw.associated);
  const originalTitle =
    (language === "zh" && associated.find((n) => HAN.test(n))) || associated.find((n) => CJK.test(n)) || null;

  // Author: NovelUpdates often lists the pen name in both scripts; prefer the romanized one.
  const authors = strings(raw.authors);
  const author = authors.find((a) => !CJK.test(a)) ?? authors[0] ?? "";
  if (!author) note("author", "No author listed — fill it in.");
  else if (authors.filter((a) => !CJK.test(a)).length > 1) {
    note("author", `Several authors listed (${authors.join(", ")}) — using “${author}”.`);
  }

  if (!language) {
    note("originalLanguage", `Language “${raw.language || "unknown"}” isn't supported — pick one.`);
  }

  // "2020 Chapters (Completed)", "1340 Chapters + 5 Side Stories (Ongoing)", "4 Volumes (Completed)"
  const statusText = raw.status ?? "";
  const statusInParens = /\(([^)]*)\)/.exec(statusText)?.[1] ?? statusText;
  const status = STATUSES.find(([re]) => re.test(statusInParens))?.[1] ?? null;
  if (!status) note("publicationStatus", `Couldn't read the status “${statusText || "—"}” — pick one.`);

  const chapters = /([\d,]+)\+?\s*(?:chapters?|chs?\b)/i.exec(statusText);
  const chapterCount = chapters ? Number(chapters[1].replace(/,/g, "")) : null;
  if (chapterCount === null) {
    note("chapterCount", statusText ? `No chapter count in “${statusText}” — fill it in.` : "No chapter count listed.");
  }

  const year = Number.parseInt(raw.year, 10);
  const startYear = year >= 1990 && year <= MAX_YEAR ? year : null;
  if (startYear === null) note("startYear", raw.year ? `Year “${raw.year}” is out of range.` : "No start year listed.");
  if (status === "Completed") note("endYear", "NovelUpdates doesn't list an end year — fill it in.");

  const originalNames = strings(raw.publisherOriginal);
  const englishNames = strings(raw.publisherEnglish);
  const publisherOriginal = matchPublisher(originalNames, ORIGINAL_PUBLISHERS);
  const publisherEnglish = matchPublisher(englishNames, ENGLISH_PUBLISHERS);
  if (!publisherOriginal && originalNames.length) {
    note("publisherOriginal", `Original publisher “${originalNames.join(", ")}” isn't in our list — left empty.`);
  }
  if (!publisherEnglish && englishNames.length) {
    note("publisherEnglish", `English publisher “${englishNames.join(", ")}” isn't in our list — left empty.`);
  }

  const allGenres = [...new Set(strings(raw.genres).map(titleCase).filter((g) => g.length <= 30))];
  const genres = allGenres.slice(0, MAX_GENRES);
  if (allGenres.length > MAX_GENRES) {
    note("genres", `${allGenres.length} genres listed — kept the first ${MAX_GENRES} (dropped ${allGenres.slice(MAX_GENRES).join(", ")}).`);
  }
  if (!genres.length) note("genres", "No genres listed — add at least one.");

  // Tags keep NovelUpdates' casing ("Weak to Strong").
  const allTags = [...new Set(strings(raw.tags).map((t) => t.trim().replace(/\s+/g, " ")).filter((t) => t.length <= 50))];
  const tags = allTags.slice(0, MAX_TAGS);
  if (allTags.length > MAX_TAGS) note("tags", `${allTags.length} tags listed — kept the first ${MAX_TAGS}.`);
  if (!Array.isArray(raw.tags)) note("tags", "No tags received — reinstall the “→ MyNovelList” bookmark to import them.");

  const synopsis = (raw.description ?? "").trim();
  if (synopsis.length > 5000) note("synopsis", "Description was longer than 5,000 characters and was cut.");

  return {
    notes,
    novel: {
      title: (raw.title ?? "").trim().slice(0, 200),
      originalTitle: originalTitle?.slice(0, 200) ?? null,
      author: author.slice(0, 120),
      originalLanguage: language ?? "zh",
      isFullyTranslated: /^yes/i.test(raw.translated ?? ""),
      publishers: { original: publisherOriginal, english: publisherEnglish },
      publication: { status: status ?? "Ongoing", startYear, endYear: null },
      chapterCount,
      synopsis: synopsis.slice(0, 5000) || null,
      genres,
      tags,
    },
  };
};
