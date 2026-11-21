import { BaseChannel, ChannelType, DirectChannel, GroupChannel, MessageHandler, NCEngine, SendTextMessageParams } from '@nexconn/chat';

function result(response) {
  if (response.code !== 0) throw new Error(`Nexconn returned code ${response.code}.`);
  return response.data;
}

function unpack(message) {
  if (message.messageType !== 'RC:TxtMsg') return null;
  let detail = {};
  try { detail = JSON.parse(message.content.extra || '{}') || {}; } catch { /* Plain SDK message. */ }
  return {
    id: message.messageId, author: message.senderUserId, time: message.sentTime,
    text: message.content.text, detail, target: message.channelIdentifier.channelId,
    direct: message.channelIdentifier.channelType === ChannelType.DIRECT
  };
}

let initializedKey;
export async function connectLive(key, token, receive) {
  if (initializedKey && initializedKey !== key) throw new Error('Reload to use a different app key.');
  if (!initializedKey) {
    NCEngine.initialize({ appKey: key });
    initializedKey = key;
  }
  NCEngine.addMessageHandler('relay', new MessageHandler({
    onMessageReceived({ messages }) { messages.map(unpack).filter(Boolean).forEach(receive); }
  }));
  const { userId } = result(await NCEngine.connect({ token }));
  function channel(room) {
    return room.direct ? new DirectChannel(room.target) : new GroupChannel(room.target);
  }
  return {
    userId,
    history(room) {
      const query = BaseChannel.createMessagesQuery({
        channelIdentifier: channel(room).identifier, startTime: Date.now(), pageSize: 100, isAscending: false
      });
      return async () => ({
        messages: result(await query.loadNextPage()).data.map(unpack).filter(Boolean),
        more: query.hasNext
      });
    },
    async send(room, text, detail) {
      const params = new SendTextMessageParams({ text, extra: JSON.stringify(detail) });
      return unpack(result(await channel(room).sendMessage(params)));
    }
  };
}
