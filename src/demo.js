const prefix = 'relay.demo.message.';
export function demoSession(userId, receive) {
  function forUser(message) {
    if (!message.direct) return message;
    if (message.author === userId) return message;
    if (message.target === userId) return { ...message, target: message.author };
    return null;
  }
  window.addEventListener('storage', event => {
    if (!event.key?.startsWith(prefix) || !event.newValue) return;
    const message = forUser(JSON.parse(event.newValue));
    if (message) receive(message);
  });
  return {
    userId,
    history(room) {
      return async () => {
        const messages = Object.keys(localStorage).filter(key => key.startsWith(prefix))
          .map(key => forUser(JSON.parse(localStorage.getItem(key))))
          .filter(message => message && message.target === room.target && message.direct === room.direct);
        return { messages, more: false };
      };
    },
    async send(room, text, detail) {
      const message = { ...room, id: crypto.randomUUID(), time: Date.now(), author: userId, text, detail };
      localStorage.setItem(prefix + message.id, JSON.stringify(message));
      return message;
    }
  };
}
