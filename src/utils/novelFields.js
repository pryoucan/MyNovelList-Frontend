// Shared choices and display helpers for novel details (forms, review, history).
export const LANGUAGE_OPTIONS = [
  { value: "zh", label: "Chinese" },
  { value: "en", label: "English" },
];
export const PUBLICATION_OPTIONS = [
  { value: "Ongoing", label: "Ongoing" },
  { value: "Completed", label: "Finished" },
  { value: "Upcoming", label: "Upcoming" },
  { value: "On Hiatus", label: "On hiatus" },
  { value: "Cancelled", label: "Cancelled" },
];
export const ORIGINAL_PUBLISHERS = ["Qidian", "Zongheng", "Jinjiang", "17K"];
export const ENGLISH_PUBLISHERS = ["Wuxiaworld", "Web Novel"];

const LANGUAGE_LABEL = Object.fromEntries(LANGUAGE_OPTIONS.map((o) => [o.value, o.label]));
const PUBLICATION_LABEL = Object.fromEntries(PUBLICATION_OPTIONS.map((o) => [o.value, o.label]));

// Human-readable value for a GlobalNovel field (as stored, flat).
export const formatField = (field, value) => {
  if (value === null || value === undefined || value === "") return "—";
  switch (field) {
    case "originalLanguage":
      return LANGUAGE_LABEL[value] ?? value;
    case "publicationStatus":
      return PUBLICATION_LABEL[value] ?? value;
    case "isFullyTranslated":
      return value ? "Fully translated" : "Partially translated";
    case "chapterCount":
      return Number(value).toLocaleString();
    case "genres":
      return Array.isArray(value) ? value.join(", ") : String(value);
    default:
      return String(value);
  }
};

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
