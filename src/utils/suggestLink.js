// Where "Suggest a novel" links go. Logged-out users are sent to log in; the
// search text (if any) prefills the title on the suggest form.
export const suggestNovelPath = (title = "") => {
  if (!localStorage.getItem("displayUsername")) return "/login";
  const t = title.trim();
  return t ? `/suggest?title=${encodeURIComponent(t)}` : "/suggest";
};
