import { randomUUID } from "crypto";

const STREAM_TTL_MS = 10 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 1000;
const sessions = new Map();

const toSSEChunk = (chunk) => {
  const lines = [];
  lines.push(`id: ${chunk.id}`);
  if (chunk.event) {
    lines.push(`event: ${chunk.event}`);
  }
  lines.push(`data: ${JSON.stringify(chunk.data)}`);
  return `${lines.join("\n")}\n\n`;
};

const writeChunkToResponse = (res, chunk) => {
  if (res.writableEnded || res.destroyed) return;
  res.write(toSSEChunk(chunk));
};

const extendExpireAt = (session) => {
  session.updatedAt = Date.now();
  session.expireAt = session.updatedAt + STREAM_TTL_MS;
};

const closeSubscribers = (session) => {
  for (const res of session.subscribers) {
    if (!res.writableEnded && !res.destroyed) {
      res.end();
    }
  }
  session.subscribers.clear();
};

export const disconnectSubscribers = (session) => {
  closeSubscribers(session);
  extendExpireAt(session);
};

export const createStreamSession = (meta = {}, requestId = randomUUID()) => {
  const now = Date.now();
  const session = {
    requestId,
    status: "streaming",
    chunks: [],
    subscribers: new Set(),
    meta,
    createdAt: now,
    updatedAt: now,
    expireAt: now + STREAM_TTL_MS,
  };
  sessions.set(requestId, session);
  return session;
};

export const getStreamSession = (requestId) => sessions.get(requestId) || null;

export const subscribeStreamSession = (session, res) => {
  session.subscribers.add(res);
  extendExpireAt(session);
};

export const unsubscribeStreamSession = (session, res) => {
  session.subscribers.delete(res);
  extendExpireAt(session);
};

export const appendStreamChunk = (session, event, payload) => {
  const chunkId = session.chunks.length + 1;
  const chunk = {
    id: chunkId,
    event,
    data: {
      requestId: session.requestId,
      chunkId,
      ...payload,
    },
    createdAt: Date.now(),
  };

  session.chunks.push(chunk);
  extendExpireAt(session);

  for (const res of session.subscribers) {
    writeChunkToResponse(res, chunk);
  }

  return chunk;
};

export const replayStreamChunks = (session, res, lastChunkId = 0) => {
  const nextChunks = session.chunks.filter((chunk) => chunk.id > lastChunkId);
  nextChunks.forEach((chunk) => writeChunkToResponse(res, chunk));
  extendExpireAt(session);
  return nextChunks.length;
};

export const markStreamSessionDone = (session) => {
  session.status = "done";
  extendExpireAt(session);
  closeSubscribers(session);
};

export const markStreamSessionError = (session) => {
  session.status = "error";
  extendExpireAt(session);
  closeSubscribers(session);
};

const cleanupExpiredSessions = () => {
  const now = Date.now();
  for (const [requestId, session] of sessions.entries()) {
    if (session.expireAt <= now) {
      closeSubscribers(session);
      sessions.delete(requestId);
    }
  }
};

const timer = setInterval(cleanupExpiredSessions, CLEANUP_INTERVAL_MS);
timer.unref?.();
