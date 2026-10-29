export const mapThreadItem = (reviews, reviewId, replyId, change) => reviews.map((review) => {
  if (review.id !== reviewId) return review;
  if (!replyId) return change(review);
  const mapReplies = (replies) => replies.map((reply) => reply.id === replyId
    ? change(reply)
    : { ...reply, children: mapReplies(reply.children ?? []) });
  return { ...review, replies: mapReplies(review.replies ?? []) };
});

export const appendThreadReply = (reviews, reviewId, parentId, created) => reviews.map((review) => {
  if (review.id !== reviewId) return review;
  if (!parentId) return { ...review, replies: [...(review.replies ?? []), created] };
  const append = (replies) => replies.map((reply) => reply.id === parentId
    ? { ...reply, children: [...(reply.children ?? []), created] }
    : { ...reply, children: append(reply.children ?? []) });
  return { ...review, replies: append(review.replies ?? []) };
});
