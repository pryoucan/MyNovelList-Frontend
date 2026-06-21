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

  const reset = () => {
    setStatus("Reading");
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