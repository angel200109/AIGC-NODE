import validate from "../utils/validate.js";
import tools from "../config/tools.js";
import config from "../default.js";
import {
  appendStreamChunk,
  createStreamSession,
  getStreamSession,
  markStreamSessionDone,
  markStreamSessionError,
  replayStreamChunks,
  subscribeStreamSession,
  unsubscribeStreamSession,
} from "../utils/streamSessionManager.js";

// const DEBUG_DISCONNECT_ENABLED = true;
// const DEBUG_DISCONNECT_AT_CHUNK = 6;
//
// const maybeInjectDisconnect = (session, chunkId) => {
//   if (!DEBUG_DISCONNECT_ENABLED) return;
//   if (session.meta.debugDisconnectTriggered) return;
//   if (chunkId < DEBUG_DISCONNECT_AT_CHUNK) return;
//
//   session.meta.debugDisconnectTriggered = true;
//   console.log(
//     `[debug] force disconnect stream requestId=${session.requestId} at chunk=${chunkId}`,
//   );
//   disconnectSubscribers(session);
// };

const maybeInjectDisconnect = () => {};

const setupSSEHeaders = (ctx) => {
  ctx.status = 200;
  ctx.respond = false;
  ctx.set("Content-Type", "text/event-stream; charset=utf-8");
  ctx.set("Cache-Control", "no-cache");
  ctx.set("Connection", "keep-alive");
  ctx.set("X-Accel-Buffering", "no");
  ctx.res.flushHeaders?.();
};

const normalizeMessages = (chatMessages) => {
  const normalized = [...chatMessages];
  normalized.pop();
  return [
    {
      role: "system",
      content: config.aiPrompt.systemContent,
    },
    ...normalized,
  ];
};

const streamCompletion = async (session, chatMessages) => {
  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({
    apiKey: process.env.API_KEY,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  });

  const messages = normalizeMessages(chatMessages);
  const completion = await openai.chat.completions.create({
    model: "qwen3.5-plus",
    messages,
    stream: true,
    tools,
  });

  let functionName = "";
  let requireParameters = "";
  let lastMessage = null;

  const metaChunk = appendStreamChunk(session, "message", {
    type: "meta",
    functionName: "",
    data: {
      requestId: session.requestId,
    },
  });
  maybeInjectDisconnect(session, metaChunk.id);

  for await (const chunk of completion) {
    const obj = JSON.parse(JSON.stringify(chunk));
    const delta = obj.choices[0].delta;

    if (delta.content) {
      const contentChunk = appendStreamChunk(session, "message", {
        type: "content",
        functionName: "",
        data: delta.content,
      });
      maybeInjectDisconnect(session, contentChunk.id);
    }

    if (delta.content == null && delta.tool_calls) {
      if (messages[messages.length - 1].role !== "assistant") {
        messages.push({
          role: "assistant",
          content: "",
          tool_calls: [],
        });
        lastMessage = messages[messages.length - 1];
      }

      const toolCalls = delta.tool_calls;
      if (toolCalls.length > 0 && lastMessage) {
        if (lastMessage.tool_calls.length <= 0) {
          functionName = toolCalls[0].function.name;
          lastMessage.tool_calls.push(toolCalls[0]);
        }
      }

      toolCalls.forEach((item) => {
        if (item.function.arguments) {
          requireParameters += item.function.arguments;
        }
        if (lastMessage?.tool_calls?.[0]?.function) {
          lastMessage.tool_calls[0].function.arguments = requireParameters;
        }
      });
    }

    if (obj.choices[0].finish_reason === "tool_calls") {
      const functionChunk = appendStreamChunk(session, "message", {
        type: "function",
        functionName,
        data: JSON.parse(requireParameters),
      });
      maybeInjectDisconnect(session, functionChunk.id);
      appendStreamChunk(session, "done", { done: true });
      markStreamSessionDone(session);
      return;
    }
  }

  appendStreamChunk(session, "done", { done: true });
  markStreamSessionDone(session);
};

const startStreamTask = (session, chatMessages) => {
  void streamCompletion(session, chatMessages).catch((error) => {
    appendStreamChunk(session, "error", {
      done: true,
      error: error.message || "stream_error",
    });
    markStreamSessionError(session);
  });
};

class ChatStreamController {
  async create(ctx) {
    const { chatMessages, requestId } = ctx.request.body;
    await validate.isArray("chatMessages", chatMessages, "对话信息不能为空");

    setupSSEHeaders(ctx);
    let session = null;
    if (typeof requestId === "string" && requestId.trim()) {
      session = getStreamSession(requestId);
    }

    if (!session) {
      session = createStreamSession({}, requestId);
      startStreamTask(session, chatMessages);
    }

    if (session.status === "done" || session.status === "error") {
      replayStreamChunks(session, ctx.res, 0);
      ctx.res.end();
      return;
    }

    subscribeStreamSession(session, ctx.res);
    replayStreamChunks(session, ctx.res, 0);

    ctx.req.on("close", () => {
      const currentSession = getStreamSession(session.requestId);
      if (currentSession) {
        unsubscribeStreamSession(currentSession, ctx.res);
      }
    });
  }

  async resume(ctx) {
    const { requestId, lastChunkId = 0 } = ctx.request.body;
    await validate.nonEmptyString("requestId", requestId, "requestId不能为空");

    const session = getStreamSession(requestId);
    if (!session) {
      throw {
        msg: "流会话不存在或已过期",
        code: 404,
        validate: null,
      };
    }

    setupSSEHeaders(ctx);
    if (session.status === "done" || session.status === "error") {
      replayStreamChunks(session, ctx.res, Number(lastChunkId) || 0);
      ctx.res.end();
      return;
    }

    subscribeStreamSession(session, ctx.res);
    replayStreamChunks(session, ctx.res, Number(lastChunkId) || 0);
    ctx.req.on("close", () => {
      const currentSession = getStreamSession(requestId);
      if (currentSession) {
        unsubscribeStreamSession(currentSession, ctx.res);
      }
    });
  }
}

export default new ChatStreamController();
