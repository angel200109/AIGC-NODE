import validate from "../utils/validate.js";
import tools from "../config/tools.js";
import config from "../default.js";
import axios from "axios";
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

const queryTrainTicketUrl =
  "https://jmhccx.market.alicloudapi.com/train-query/ticket";
const queryWeatherUrl = "https://ali-weather.showapi.com/day15";

const buildToolHeaders = () => ({
  Authorization: `APPCODE ${process.env.ALIYUN_MARKET_APPCODE}`,
});

const buildTrainTicketHeaders = () => ({
  ...buildToolHeaders(),
  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
});

const extractTrainTicketPayload = (payload) => {
  if (Array.isArray(payload)) {
    return { list: payload };
  }

  return payload?.data || payload?.result || payload || {};
};

const normalizeSeatInfo = (seat) => {
  if (!seat || typeof seat !== "object") {
    return null;
  }

  return {
    price: seat.price ?? "--",
    num: seat.num ?? "--",
    discount: seat.discount ?? "",
  };
};

const normalizeTrainTicketItem = (item) => ({
  trainNo: item.trainno,
  type: item.type,
  departureStation: item.departstation,
  arrivalStation: item.endstation,
  departureTime: item.departuretime,
  arrivalTime: item.arrivaltime,
  duration: item.costtime,
  sequenceNo: item.sequenceno,
  secondClass: normalizeSeatInfo(item.ze),
  firstClass: normalizeSeatInfo(item.zy),
  businessClass: normalizeSeatInfo(item.swz),
  noSeat: normalizeSeatInfo(item.wz),
  softSleeper: normalizeSeatInfo(item.rw),
  hardSleeper: normalizeSeatInfo(item.yw),
  hardSeat: normalizeSeatInfo(item.yz),
});

const buildToolStatusMessage = (functionName, args) => {
  if (functionName === "get_weather") {
    return `正在查询${args.city}的天气...`;
  }

  if (functionName === "get_train_tickets") {
    let date = args.date || "今天";
    return `正在查询${args.departure}到${args.destination}${date}出发的车票...`;
  }

  return "正在搜索...";
};

const normalizeToolResult = (functionName, args, data) => {
  if (functionName === "get_weather") {
    const forecast = Array.isArray(data)
      ? data.slice(0, 3).map((item) => ({
          date: item.daytime,
          week: item.weekday,
          dayWeather: item.day_weather,
          nightWeather: item.night_weather,
          dayTemp: item.day_air_temperature,
          nightTemp: item.night_air_temperature,
          dayWind: item.day_wind_direction,
          nightWind: item.night_wind_direction,
        }))
      : [];

    return {
      city: args.city,
      forecast,
    };
  }

  if (functionName === "get_train_tickets") {
    const ticketPayload = data && !Array.isArray(data) ? data : { list: data };
    const ticketList = Array.isArray(ticketPayload.list)
      ? ticketPayload.list
      : [];

    return {
      departure: ticketPayload.start || args.departure,
      destination: ticketPayload.end || args.destination,
      date: ticketPayload.date || args.date || "",
      updateTime: ticketPayload.updateTime || "",
      tickets: ticketList.slice(0, 10).map(normalizeTrainTicketItem),
    };
  }

  return data;
};

const executeToolCall = async (functionName, args) => {
  if (functionName === "get_weather") {
    const res = await axios.get(queryWeatherUrl, {
      params: { area: args.city },
      headers: buildToolHeaders(),
    });

    return normalizeToolResult(
      functionName,
      args,
      res.data?.showapi_res_body?.dayList || [],
    );
  }

  if (functionName === "get_train_tickets") {
    const body = new URLSearchParams();
    body.set("start", args.departure);
    body.set("end", args.destination);
    if (typeof args.ishigh === "string" && args.ishigh.trim()) {
      body.set("ishigh", args.ishigh.trim());
    }
    if (typeof args.date === "string" && args.date.trim()) {
      body.set("date", args.date.trim());
    }
    const res = await axios.post(queryTrainTicketUrl, body.toString(), {
      headers: buildTrainTicketHeaders(),
    });

    return normalizeToolResult(
      functionName,
      args,
      extractTrainTicketPayload(res.data),
    );
  }

  throw new Error(`unsupported tool call: ${functionName}`);
};

const streamAssistantContent = async (session, completion) => {
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
  }
};

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
  let hasToolCall = false;

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
      hasToolCall = true;
      const toolArgs = JSON.parse(requireParameters);
      const statusChunk = appendStreamChunk(session, "message", {
        type: "status",
        functionName,
        data: buildToolStatusMessage(functionName, toolArgs),
      });
      maybeInjectDisconnect(session, statusChunk.id);
      const toolResult = await executeToolCall(functionName, toolArgs);

      messages.push({
        role: "assistant",
        content: "",
        tool_calls: lastMessage?.tool_calls || [],
      });

      messages.push({
        role: "tool",
        tool_call_id: lastMessage?.tool_calls?.[0]?.id,
        content: JSON.stringify(toolResult),
      });

      break;
    }
  }

  if (hasToolCall) {
    const finalCompletion = await openai.chat.completions.create({
      model: "qwen3.5-plus",
      messages,
      stream: true,
    });

    await streamAssistantContent(session, finalCompletion);
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
