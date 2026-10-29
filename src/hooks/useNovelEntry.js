import { useState } from "react";

export function useNovelEntry() {
  const [status, setStatus] = useState("Reading");
  const [progress, setProgress] = useState(0);
  const [rating, setRating] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [completedAt, setCompletedAt] = useState(null);

  const fill = (data = {}) => {
    setStatus(data.status ?? "Reading");
    setProgress(data.progress ?? 0);
    setRating(data.rating ?? null);

    setStartedAt(data.startedAt ? data.startedAt.split("T")[0] : null);
    setCompletedAt(data.completedAt ? data.completedAt.split("T")[0] : null);
  };

  // Unreleased novels can only be planned, so callers pass "Plan To Read" for them.
  const reset = (defaultStatus = "Reading") => {
    setStatus(defaultStatus);
    setProgress(0);
    setRating(null);
    setStartedAt(null);
    setCompletedAt(null);
  };

  return {
    status,
    progress,
    rating,
    startedAt,
    completedAt,
    setStatus,
    setProgress,
    setRating,
    setStartedAt,
    setCompletedAt,
    fill,
    reset,
  };
}

// Request body for POST/PATCH /api/users/novels. The backend rejects extra
// fields for "Plan To Read", and completedAt for anything but "Completed".
export function buildEntryPayload(entry) {
  if (entry.status === "Plan To Read") {
    return { status: entry.status };
  }
  return {
    status: entry.status,
    progress: entry.progress === "" ? 0 : (entry.progress ?? 0),
    rating: entry.rating ?? null,
    startedAt: entry.startedAt ?? null,
    completedAt: entry.status === "Completed" ? entry.completedAt ?? null : null,
  };
}
