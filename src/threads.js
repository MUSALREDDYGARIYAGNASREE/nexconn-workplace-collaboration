export function groupThreads(messages) {
  const threads = new Map();
  for (const message of messages) {
    const parent = message.detail?.replyTo;
    const id = typeof parent === 'string' && parent ? parent : message.id;
    if (!threads.has(id)) threads.set(id, { id, root: null, replies: [] });
    const thread = threads.get(id);
    if (id === message.id) thread.root = message;
    else thread.replies.push(message);
  }
  return [...threads.values()];
}
