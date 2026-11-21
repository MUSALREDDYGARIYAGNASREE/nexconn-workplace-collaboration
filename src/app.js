import { connectLive } from './transport.js';
import { demoSession } from './demo.js';

import { groupThreads } from './threads.js';

const $ = id => document.getElementById(id);
const types = {
  project: { label: 'Project threads', action: 'Open project discussions', field: 'Project group ID', description: 'Start a topic or reply to an existing project discussion.', empty: 'Start the first project discussion.' },
  handover: { label: 'Shift handover', action: 'Open handover channel', field: 'Handover group ID', description: 'Brief the incoming shift and confirm who has picked up each handover.', empty: 'Publish the first shift handover.' },
  direct: { label: 'Direct messages', action: 'Message a teammate', field: 'Teammate user ID', description: 'A private conversation between you and your teammate.', empty: 'Start the conversation with a message.' }
};
function element(tag, text, className) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}
const demoUser = new URLSearchParams(location.search).get('as') === 'mina' ? 'mina' : 'alex';
let session = demoSession(demoUser, message => { if (mode === 'Demo') receive(message); });
let mode = 'Demo', namespace = '', rooms = [], active, adding, nextPage, replyTo;
let messages = new Map(), generation = 0, sending = false;

function receive(message) {
  if (message.direct && !rooms.some(room => room.direct && room.target === message.target)) {
    rooms.push({ kind: 'direct', direct: true, target: message.target });
    saveRooms(); sidebar();
    if (!active) { openRoom(rooms.at(-1)); }
  }
  if (active && message.target === active.target && message.direct === active.direct) {
    messages.set(message.id, message); render();
  }
}
function saveRooms() { localStorage.setItem(namespace, JSON.stringify(rooms)); }
function start(key) {
  namespace = JSON.stringify(['relay.rooms', mode, key, session.userId]);
  const saved = localStorage.getItem(namespace);
  rooms = saved ? JSON.parse(saved) : [];
  if (mode === 'Demo' && !saved) {
    rooms.push({ kind: 'project', direct: false, target: 'Studio launch' });
    rooms.push({ kind: 'handover', direct: false, target: 'Operations desk' });
    rooms.push({ kind: 'direct', direct: true, target: demoUser === 'alex' ? 'mina' : 'alex' });
  }
  $('mode').textContent = mode;
  $('identity').textContent = session.userId;
  $('session-note').textContent = mode === 'Demo' ? 'Local browser demo' : 'Nexconn workspace';
  $('account').textContent = mode === 'Demo' ? 'Connect Nexconn' : 'End session';
  openRoom(rooms[0]);
}
function sidebar() {
  $('rooms').replaceChildren();
  for (const [kind, type] of Object.entries(types)) {
    const heading = element('h3', type.label);
    const add = element('button', '+'); add.setAttribute('aria-label', type.action);
    add.onclick = () => {
      adding = kind; $('target').setCustomValidity(''); $('add-title').textContent = type.action; $('target-label').textContent = type.field;
      $('target').value = ''; $('add').showModal();
    };
    heading.append(add); $('rooms').append(heading);
    for (const room of rooms.filter(room => room.kind === kind)) {
      const button = element('button', room.target, room === active ? 'selected' : '');
      button.onclick = () => openRoom(room); $('rooms').append(button);
    }
  }
}
async function openRoom(room) {
  generation++; $('compose').inert = false; active = room; replyTo = null; sending = false; messages = new Map(); sidebar();
  $('compose').reset();
  $('handover-fields').hidden = room?.kind !== 'handover';
  $('shift').required = room?.kind === 'handover';
  $('notice').textContent = ''; $('older').hidden = true;
  $('category').textContent = room ? types[room.kind].label : 'Workspace';
  $('title').textContent = room?.target || 'Your conversations';
  $('description').textContent = room ? types[room.kind].description : 'Open a conversation using the + beside a channel type.';
  $('compose').hidden = !room; render();
  if (room) { nextPage = session.history(room); await loadPage(); }
}
async function loadPage() {
  const current = generation; $('older').disabled = true;
  try {
    const page = await nextPage();
    if (current !== generation) return;
    page.messages.forEach(message => messages.set(message.id, message));
    $('older').hidden = !page.more; $('notice').textContent = ''; render();
  } catch (error) {
    if (current === generation) { $('notice').textContent = error.message; $('older').hidden = false; }
  } finally { if (current === generation) $('older').disabled = false; }
}
function row(message) {
  const article = element('article', '', 'entry');
  article.append(element('b', message.author), element('small', new Date(message.time).toLocaleString()), element('p', message.text));
  return article;
}
function render() {
  $('feed').replaceChildren(); $('send').disabled = sending;
  if (!active) return;
  const sorted = [...messages.values()].sort((a,b) => a.time - b.time || a.id.localeCompare(b.id));
  if (!sorted.length) $('feed').append(element('p', types[active.kind].empty, 'empty'));
  $('prompt').textContent = replyTo ? 'Reply to thread' : active.kind === 'project' ? 'New discussion' : 'Message';
  $('cancel').hidden = !replyTo;
  $('send').textContent = replyTo ? 'Send reply ↗' : active.kind === 'project' ? 'Post topic ↗' : 'Send message ↗';
  if (active.kind === 'handover') {
    $('prompt').textContent = 'Shift summary'; $('send').textContent = 'Publish handover ↗';
    for (const thread of groupThreads(sorted)) {
      const article = thread.root ? row(thread.root) : element('article', 'Earlier handover', 'entry');
      if (thread.root?.detail.shift) article.prepend(element('h3', thread.root.detail.shift));
      if (thread.root?.detail.followup) article.append(element('b', 'Open items'), element('p', thread.root.detail.followup));
      for (const reply of thread.replies) article.append(element('p', reply.author + ' · ' + reply.text));
      if (thread.root && thread.root.author !== session.userId && !thread.replies.some(reply => reply.author === session.userId && reply.detail.ack)) {
        const button = element('button', 'Acknowledge handover'); button.disabled = sending;
        button.onclick = () => deliver('Acknowledged handover', { replyTo: thread.id, ack: true });
        article.append(button);
      }
      $('feed').append(article);
    }
    return;
  }
  if (active.kind !== 'project') {
    for (const message of sorted) $('feed').append(row(message));
    return;
  }
  for (const thread of groupThreads(sorted)) {
    const article = thread.root ? row(thread.root) : element('article', 'Earlier topic · load previous messages', 'entry');
    for (const reply of thread.replies) { const item = row(reply); item.classList.add('reply'); article.append(item); }
    const button = element('button', 'Reply');
    button.onclick = () => { replyTo = thread.id; render(); $('body').focus(); };
    article.append(button); $('feed').append(article);
  }
}
$('cancel').onclick = () => { replyTo = null; render(); };
$('older').onclick = loadPage;
$('new-room').onsubmit = event => {
  event.preventDefault(); const target = $('target').value.trim();
  if (!target || (adding === 'direct' && target === session.userId)) {
    $('target').setCustomValidity('Enter a different teammate or channel ID.'); $('target').reportValidity(); return;
  }
  let room = rooms.find(room => room.target === target && room.direct === (adding === 'direct'));
  if (room && room.kind !== adding) { $('target').setCustomValidity('Use a separate group for each channel type.'); $('target').reportValidity(); return; }
  if (!room) { room = { target, kind: adding, direct: adding === 'direct' }; rooms.push(room); saveRooms(); }
  $('add').close(); openRoom(room);
};
$('target').oninput = () => $('target').setCustomValidity('');
$('compose').onsubmit = async event => {
  event.preventDefault(); const text = $('body').value.trim();
  if (!text || sending) return;
  const detail = active.kind === 'handover'
    ? { shift: $('shift').value.trim(), followup: $('followup').value.trim() }
    : replyTo ? { replyTo } : {};
  if (active.kind === 'handover' && !detail.shift) { $('shift').focus(); return; }
  await deliver(text, detail, true);
};
async function deliver(text, detail, clearDraft = false) {
  if (sending) return;
  const current = generation;
  sending = true; $('compose').inert = true; render();
  try {
    const sent = await session.send(active, text, detail);
    if (current === generation) {
      if (clearDraft) { $('compose').reset(); replyTo = null; }
      messages.set(sent.id, sent); $('notice').textContent = '';
    }
  } catch (error) { if (current === generation) $('notice').textContent = error.message; }
  finally { if (current === generation) { sending = false; $('compose').inert = false; render(); } }
}
$('account').onclick = () => { if (mode === 'Demo') $('connect').showModal(); else location.reload(); };
$('login').onsubmit = async event => {
  event.preventDefault(); const form = event.currentTarget, submit = form.querySelector('.primary');
  submit.disabled = true; $('login-error').textContent = 'Connecting…';
  try {
    const key = form.elements.key.value.trim();
    session = await connectLive(key, form.elements.token.value.trim(), receive);
    form.reset(); mode = 'Live'; $('connect').close(); start(key);
  } catch (error) { $('login-error').textContent = error.message; }
  finally { submit.disabled = false; }
};
document.querySelectorAll('[data-close]').forEach(button => button.onclick = () => button.closest('dialog').close());
start('');
