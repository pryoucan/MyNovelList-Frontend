import { useId, useMemo, useRef, useState } from "react";
import NovelThumb from "./NovelThumb";
import PublicationIcon from "./PublicationIcon";
import { prepareCover } from "../utils/coverImage";
import {
  LANGUAGE_OPTIONS,
  PUBLICATION_OPTIONS,
  ORIGINAL_PUBLISHERS,
  ENGLISH_PUBLISHERS,
} from "../utils/novelFields";
import "../design/NovelForm.css";

const MAX_GENRES = 12;
const MAX_TAGS = 100;
const SYNOPSIS_MAX = 5000;
const MAX_YEAR = new Date().getFullYear() + 2;

// API novel (nested publishers/publication) → flat form state.
const toForm = (novel) => ({
  title: novel?.title ?? "",
  originalTitle: novel?.originalTitle ?? "",
  author: novel?.author ?? "",
  originalLanguage: novel?.originalLanguage ?? "zh",
  publicationStatus: novel?.publication?.status ?? "Ongoing",
  startYear: novel?.publication?.startYear ?? "",
  endYear: novel?.publication?.endYear ?? "",
  chapterCount: novel?.chapterCount ?? "",
  isFullyTranslated: novel?.isFullyTranslated ?? false,
  publisherOriginal: novel?.publishers?.original ?? "",
  publisherEnglish: novel?.publishers?.english ?? "",
  genres: novel?.genres ?? [],
  tags: novel?.tags ?? [],
  synopsis: novel?.synopsis ?? "",
});

const num = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
const str = (v) => (v?.trim?.() ? v.trim() : null);

// Normalised value per field, used for both the API body and change detection.
const normalized = (form) => ({
  title: form.title.trim(),
  originalTitle: str(form.originalTitle),
  author: form.author.trim(),
  originalLanguage: form.originalLanguage,
  publicationStatus: form.publicationStatus,
  startYear: num(form.startYear),
  endYear: num(form.endYear),
  chapterCount: num(form.chapterCount),
  isFullyTranslated: !!form.isFullyTranslated,
  publisherOriginal: form.publisherOriginal || null,
  publisherEnglish: form.publisherEnglish || null,
  genres: form.genres,
  tags: form.tags,
  synopsis: str(form.synopsis),
});

// Flat values → the API's nested shape. With `only`, includes just those fields.
const toApi = (values, only) => {
  const has = (k) => !only || only.has(k);
  const body = {};
  for (const k of ["title", "originalTitle", "author", "originalLanguage", "isFullyTranslated", "chapterCount", "synopsis", "genres", "tags"]) {
    if (has(k)) body[k] = values[k];
  }
  const publication = {};
  if (has("publicationStatus")) publication.status = values.publicationStatus;
  if (has("startYear")) publication.startYear = values.startYear;
  if (has("endYear")) publication.endYear = values.endYear;
  if (Object.keys(publication).length) body.publication = publication;
  const publishers = {};
  if (has("publisherOriginal")) publishers.original = values.publisherOriginal;
  if (has("publisherEnglish")) publishers.english = values.publisherEnglish;
  if (Object.keys(publishers).length) body.publishers = publishers;
  return body;
};

const validate = (v) => {
  const errors = {};
  if (!v.title) errors.title = "Title is required";
  if (!v.author) errors.author = "Author is required";
  if (v.genres.length === 0) errors.genres = "Add at least one genre";
  for (const key of ["startYear", "endYear"]) {
    if (v[key] !== null && (!Number.isInteger(v[key]) || v[key] < 1990 || v[key] > MAX_YEAR)) {
      errors[key] = `Use a year between 1990 and ${MAX_YEAR}`;
    }
  }
  if (!errors.endYear && v.startYear && v.endYear && v.endYear < v.startYear) {
    errors.endYear = "Can't be before the start year";
  }
  if (v.chapterCount !== null && (!Number.isInteger(v.chapterCount) || v.chapterCount < 0)) {
    errors.chapterCount = "Use a whole number";
  }
  if (v.publicationStatus === "Completed") {
    if (v.chapterCount === null) errors.chapterCount = "Needed for a finished novel";
    if (v.endYear === null) errors.endYear = "Needed for a finished novel";
  }
  if ((v.synopsis?.length ?? 0) > SYNOPSIS_MAX) errors.synopsis = `Keep it under ${SYNOPSIS_MAX} characters`;
  return errors;
};

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const titleCase = (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// Chips with a text input: Enter or comma adds one, Backspace on an empty
// input removes the last. `suggestions` are offered as one-click additions.
function ChipsField({ inputId, label, values, max, maxLength, normalize = (s) => s, suggestions = [], placeholder, onChange }) {
  const [draft, setDraft] = useState("");
  const add = (raw) => {
    const value = normalize(raw.trim().replace(/\s+/g, " "));
    if (!value || value.length > maxLength) return;
    if (values.length < max && !values.some((v) => v.toLowerCase() === value.toLowerCase())) {
      onChange([...values, value]);
    }
    setDraft("");
  };
  const remove = (value) => onChange(values.filter((v) => v !== value));
  const matches = suggestions
    .filter((s) => !values.includes(s) && s.toLowerCase().includes(draft.trim().toLowerCase()))
    .slice(0, 8);

  return (
    <>
      <div className="nf-genres">
        {values.map((v) => (
          <span key={v} className="nf-genre">
            {v}
            <button type="button" onClick={() => remove(v)} aria-label={`Remove ${v}`}>×</button>
          </span>
        ))}
        {values.length < max && (
          <input
            id={inputId}
            className="nf-genre-input"
            placeholder={values.length ? "Add another…" : placeholder}
            value={draft}
            maxLength={maxLength}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                add(draft);
              } else if (e.key === "Backspace" && !draft && values.length) {
                remove(values[values.length - 1]);
              }
            }}
          />
        )}
      </div>
      {matches.length > 0 && (
        <div className="nf-genre-suggest" aria-label={`Existing ${label}`}>
          {matches.map((s) => (
            <button key={s} type="button" className="nf-genre-option" onClick={() => add(s)}>+ {s}</button>
          ))}
        </div>
      )}
    </>
  );
}

// Shared form for suggesting a new novel (mode="new") or an edit (mode="edit").
// onSubmit receives the API body: the full novel for "new", or
// { changes, cover? } with only the changed fields for "edit".
// `initialCover` (data URL) pre-selects a new cover, e.g. from an import.
export default function NovelForm({ mode, novel, initialCover = null, genreSuggestions = [], tagSuggestions = [], submitLabel, onSubmit, onCancel }) {
  const uid = useId();
  const id = (name) => `${uid}-${name}`;
  const initial = useMemo(() => toForm(novel), [novel]);
  const [form, setForm] = useState(initial);
  const [cover, setCover] = useState(initialCover); // new cover as data URL
  const [coverError, setCoverError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const fileRef = useRef(null);

  const values = normalized(form);
  const initialValues = useMemo(() => normalized(initial), [initial]);
  const errors = validate(values);
  const changed = new Set(
    mode === "edit" ? Object.keys(values).filter((k) => !same(values[k], initialValues[k])) : []
  );
  const hasChanges = mode === "new" || changed.size > 0 || !!cover;

  const set = (key) => (e) => {
    const value = e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e;
    setForm((f) => ({ ...f, [key]: value }));
    setServerError("");
  };

  const fieldClass = (key) =>
    `nf-field${changed.has(key) ? " is-changed" : ""}${showErrors && errors[key] ? " has-error" : ""}`;

  // "Changed" tag and error message under a field.
  const fieldMeta = (name) => (
    <>
      {changed.has(name) && <span className="nf-changed-tag">Changed</span>}
      {showErrors && errors[name] && (
        <p className="nf-error" id={id(`${name}-error`)}>{errors[name]}</p>
      )}
    </>
  );

  // ── Cover ──
  const pickCover = async (file) => {
    if (!file) return;
    setCoverError("");
    try {
      setCover(await prepareCover(file));
    } catch (err) {
      setCoverError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowErrors(true);
    if (Object.keys(errors).length || !hasChanges) return;
    setSubmitting(true);
    setServerError("");
    try {
      const body =
        mode === "new"
          ? { ...toApi(values), ...(cover && { cover }) }
          : { changes: toApi(values, changed), ...(cover && { cover }) };
      await onSubmit(body);
    } catch (err) {
      setServerError(err.response?.data?.message || "Couldn't send it. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const shownCover = cover ?? novel?.coverImage ?? null;
  const isFinished = form.publicationStatus === "Completed";

  return (
    <form className="nf" onSubmit={handleSubmit} noValidate>
      <div className="nf-layout">
        {/* ── Cover ── */}
        <div className={`nf-cover${cover ? " is-changed" : ""}`}>
          <span className="nf-label">Cover</span>
          <button
            type="button"
            className={`nf-dropzone${dragging ? " is-dragging" : ""}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pickCover(e.dataTransfer.files?.[0]);
            }}
            aria-label={shownCover ? "Change cover image" : "Add cover image"}
          >
            {shownCover ? (
              <img src={shownCover} alt="" className="nf-cover-img" />
            ) : form.title.trim() ? (
              <NovelThumb title={form.title} size="lg" />
            ) : (
              <span className="nf-dropzone-empty">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="9" cy="9" r="1.75" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                Drop an image or click to choose
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            hidden
            accept="image/png, image/jpeg, image/webp"
            onChange={(e) => {
              pickCover(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <p className="nf-hint">Cropped to 3:4. PNG, JPEG or WebP. Only upload covers you're allowed to share.</p>
          {cover && (
            <button type="button" className="nf-link" onClick={() => setCover(null)}>
              {novel?.coverImage ? "Keep current cover" : "Remove image"}
            </button>
          )}
          {cover && mode === "edit" && <span className="nf-changed-tag">New cover</span>}
          {coverError && <p className="nf-error" role="alert">{coverError}</p>}
        </div>

        {/* ── Details ── */}
        <div className="nf-fields">
          <div className={fieldClass("title")}>
            <label className="nf-label" htmlFor={id("title")}>Title <span className="nf-req">*</span></label>
            <input id={id("title")} className="nf-input" maxLength={200} value={form.title} onChange={set("title")}
              aria-invalid={showErrors && !!errors.title} aria-describedby={errors.title ? id("title-error") : undefined} />
            {fieldMeta("title")}
          </div>

          <div className="nf-row">
            <div className={fieldClass("originalTitle")}>
              <label className="nf-label" htmlFor={id("originalTitle")}>Original title</label>
              <input id={id("originalTitle")} className="nf-input" maxLength={200} placeholder="e.g. 仙逆"
                value={form.originalTitle} onChange={set("originalTitle")} />
              {fieldMeta("originalTitle")}
            </div>
            <div className={fieldClass("author")}>
              <label className="nf-label" htmlFor={id("author")}>Author <span className="nf-req">*</span></label>
              <input id={id("author")} className="nf-input" maxLength={120} value={form.author} onChange={set("author")}
                aria-invalid={showErrors && !!errors.author} aria-describedby={errors.author ? id("author-error") : undefined} />
              {fieldMeta("author")}
            </div>
          </div>

          <div className={fieldClass("originalLanguage")}>
            <span className="nf-label" id={id("lang")}>Original language</span>
            <div className="nf-segmented" role="radiogroup" aria-labelledby={id("lang")}>
              {LANGUAGE_OPTIONS.map((o) => (
                <button key={o.value} type="button" role="radio" aria-checked={form.originalLanguage === o.value}
                  className={`nf-seg${form.originalLanguage === o.value ? " selected" : ""}`}
                  onClick={() => set("originalLanguage")(o.value)}>
                  {o.label}
                </button>
              ))}
            </div>
            {fieldMeta("originalLanguage")}
          </div>

          <div className={fieldClass("publicationStatus")}>
            <span className="nf-label" id={id("pub")}>Publication</span>
            <div className="nf-pills" role="radiogroup" aria-labelledby={id("pub")}>
              {PUBLICATION_OPTIONS.map((o) => (
                <button key={o.value} type="button" role="radio" aria-checked={form.publicationStatus === o.value}
                  className={`nf-pill${form.publicationStatus === o.value ? " selected" : ""}`}
                  onClick={() => set("publicationStatus")(o.value)}>
                  <PublicationIcon status={o.value} size={14} />
                  {o.label}
                </button>
              ))}
            </div>
            {fieldMeta("publicationStatus")}
          </div>

          <div className="nf-row nf-row--3">
            <div className={fieldClass("startYear")}>
              <label className="nf-label" htmlFor={id("startYear")}>Start year</label>
              <input id={id("startYear")} className="nf-input" type="number" inputMode="numeric" min="1990" max={MAX_YEAR}
                placeholder="2014" value={form.startYear} onChange={set("startYear")} />
              {fieldMeta("startYear")}
            </div>
            <div className={fieldClass("endYear")}>
              <label className="nf-label" htmlFor={id("endYear")}>
                End year {isFinished && <span className="nf-req">*</span>}
              </label>
              <input id={id("endYear")} className="nf-input" type="number" inputMode="numeric" min="1990" max={MAX_YEAR}
                placeholder={isFinished ? "2020" : "—"} value={form.endYear} onChange={set("endYear")} />
              {fieldMeta("endYear")}
            </div>
            <div className={fieldClass("chapterCount")}>
              <label className="nf-label" htmlFor={id("chapterCount")}>
                Chapters {isFinished && <span className="nf-req">*</span>}
              </label>
              <input id={id("chapterCount")} className="nf-input" type="number" inputMode="numeric" min="0"
                placeholder="1,300" value={form.chapterCount} onChange={set("chapterCount")} />
              {fieldMeta("chapterCount")}
            </div>
          </div>

          <div className="nf-row">
            <div className={fieldClass("publisherOriginal")}>
              <label className="nf-label" htmlFor={id("pubO")}>Original publisher</label>
              <select id={id("pubO")} className="nf-input" value={form.publisherOriginal} onChange={set("publisherOriginal")}>
                <option value="">None / unknown</option>
                {ORIGINAL_PUBLISHERS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              {fieldMeta("publisherOriginal")}
            </div>
            <div className={fieldClass("publisherEnglish")}>
              <label className="nf-label" htmlFor={id("pubE")}>English publisher</label>
              <select id={id("pubE")} className="nf-input" value={form.publisherEnglish} onChange={set("publisherEnglish")}>
                <option value="">None / unknown</option>
                {ENGLISH_PUBLISHERS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              {fieldMeta("publisherEnglish")}
            </div>
          </div>

          <div className={fieldClass("isFullyTranslated")}>
            <label className="nf-toggle">
              <input type="checkbox" checked={form.isFullyTranslated} onChange={set("isFullyTranslated")} />
              <span className="nf-toggle-track" aria-hidden="true"><span className="nf-toggle-thumb" /></span>
              Fully translated into English
            </label>
            {fieldMeta("isFullyTranslated")}
          </div>

          <div className={fieldClass("genres")}>
            <label className="nf-label" htmlFor={id("genre")}>
              Genres <span className="nf-req">*</span>
              <span className="nf-count">{form.genres.length}/{MAX_GENRES}</span>
            </label>
            <ChipsField
              inputId={id("genre")}
              label="genres"
              values={form.genres}
              max={MAX_GENRES}
              maxLength={30}
              normalize={titleCase}
              suggestions={genreSuggestions}
              placeholder="Type a genre and press Enter"
              onChange={set("genres")}
            />
            {fieldMeta("genres")}
          </div>

          <div className={fieldClass("tags")}>
            <label className="nf-label" htmlFor={id("tag")}>
              Tags
              <span className="nf-count">{form.tags.length}/{MAX_TAGS}</span>
            </label>
            <ChipsField
              inputId={id("tag")}
              label="tags"
              values={form.tags}
              max={MAX_TAGS}
              maxLength={50}
              suggestions={tagSuggestions}
              placeholder="e.g. Weak to Strong — press Enter to add"
              onChange={set("tags")}
            />
            {fieldMeta("tags")}
          </div>

          <div className={fieldClass("synopsis")}>
            <label className="nf-label" htmlFor={id("synopsis")}>
              Synopsis
              <span className="nf-count">{form.synopsis.length.toLocaleString()}/{SYNOPSIS_MAX.toLocaleString()}</span>
            </label>
            <textarea id={id("synopsis")} className="nf-input nf-textarea" rows={6} maxLength={SYNOPSIS_MAX}
              value={form.synopsis} onChange={set("synopsis")} />
            {fieldMeta("synopsis")}
          </div>
        </div>
      </div>

      {serverError && <p className="nf-server-error" role="alert">{serverError}</p>}

      <div className="nf-actions">
        {mode === "edit" && (
          <span className="nf-summary">
            {hasChanges
              ? `${changed.size + (cover ? 1 : 0)} change${changed.size + (cover ? 1 : 0) === 1 ? "" : "s"}`
              : "No changes yet"}
          </span>
        )}
        {onCancel && (
          <button type="button" className="nf-btn nf-btn--ghost" onClick={onCancel}>Cancel</button>
        )}
        <button type="submit" className="nf-btn" disabled={submitting || !hasChanges}>
          {submitting ? "Sending…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
