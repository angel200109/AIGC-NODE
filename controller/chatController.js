import validate from "../utils/validate.js";
import tools from "../config/tools.js";
import config from "../default.js";

const writeSSE = (ctx, data, event) => {
  if (event) {
    ctx.res.write(`event: ${event}\n`);
  }
  ctx.res.write(`data: ${JSON.stringify(data)}\n\n`);
  console.log("📤 有发chunk"); // 输出发送的chunk
};

class ChatController {
  // 大模型对话接口
  async chatMessage(ctx) {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({
      apiKey: process.env.API_KEY,
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    });

    const { chatMessages } = ctx.request.body;
    await validate.isArray("chatMessages", chatMessages, "对话信息不能为空");
    chatMessages.pop();
    let messages = [
      {
        role: "system",
        content: config.aiPrompt.systemContent,
      },
      ...chatMessages,
    ];
    console.log(JSON.stringify(messages, null, 2));

    const completion = await openai.chat.completions.create({
      model: "qwen3.5-plus",
      messages,
      stream: true,
      tools,
    });

    ctx.status = 200;
    ctx.respond = false;
    ctx.set("Content-Type", "text/event-stream; charset=utf-8");
    ctx.set("Cache-Control", "no-cache");
    ctx.set("Connection", "keep-alive");
    ctx.set("X-Accel-Buffering", "no");
    ctx.res.flushHeaders?.();
    let functionName = "";
    let requireParameters = "";

    // 循环大模型的输出
    for await (const chunk of completion) {
      const str = JSON.stringify(chunk);
      const obj = JSON.parse(str);
      console.log(`${str}\n`);
      const delta = obj.choices[0].delta;

      // ------------------ 1. 没有工具调用 ------------------
      if (delta.content) {
        console.log("没有工具调用");
        const resObj = JSON.stringify({
          type: "content",
          functionName: "",
          data: delta.content,
        });
        const buffer = Buffer.from(resObj); // 将 JSON 字符串转为二进制 Buffer
        console.log("📤 发送给前端的chunk:", resObj); // 输出发送的chunk
        writeSSE(ctx, JSON.parse(buffer.toString()));
        // ctx.res.end(); 流式输出，不能加这一句，如果输出完了，会返回一个"OK"字符串
      }

      // -------------------- 2. 有工具调用 --------------------
      if (delta.content == null && delta.tool_calls) {
        if (messages[messages.length - 1].role !== "assistant") {
          messages.push({
            role: "assistant",
            content: "",
            tool_calls: [],
          });
          var lastMessage = messages[messages.length - 1];
        }
        const toolCalls = delta.tool_calls;
        if (toolCalls.length > 0) {
          if (lastMessage.tool_calls.length <= 0) {
            functionName = toolCalls[0].function.name;
            lastMessage.tool_calls.push(toolCalls[0]);
          }
        }
        toolCalls.forEach((item) => {
          if (item.function.arguments) {
            requireParameters += item.function.arguments;
          }
          lastMessage.tool_calls[0].function.arguments = requireParameters;
        });
      }

      // 工具调用结束
      if (obj.choices[0].finish_reason === "tool_calls") {
        console.log("以下是最新的一条message");
        console.log(JSON.stringify(messages[messages.length - 1], null, 2));
        const resObj = JSON.stringify({
          type: "function",
          functionName,
          data: JSON.parse(requireParameters),
        });
        console.log("📤 发送给前端的函数调用chunk:", resObj); // 输出发送的chunk
        const buffer = Buffer.from(resObj);
        writeSSE(ctx, JSON.parse(buffer.toString()));
        writeSSE(ctx, { done: true }, "done");
        ctx.res.end();
        return;
      }
    }
    writeSSE(ctx, { done: true }, "done");
    ctx.res.end();
  }

  // 图片上传接口
  async uploadFile(ctx) {
    console.log(ctx.file);
    if (ctx.file === undefined) {
      throw {
        msg: "未检测到文件，请选择一张图片上传",
        code: 442,
        validate: null,
      };
    }
    ctx.send(
      `${ctx.host}/${ctx.file.destination}${ctx.file.filename}`,
      200,
      "图片上传成功",
    );
  }
}

export default new ChatController();
