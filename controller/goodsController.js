import modelGoods from "@/model/goods.js";
import validate from "@/utils/validate.js";
import fs from "fs";
class GoodsController {
  // 导入商品
  async addGoods(ctx) {
    const goodsFile = fs.readFileSync(
      "D:/Code/Frontend/AIGC-NODE/goods.json",
      "utf-8"
    );
    const json = JSON.parse(goodsFile);
    await modelGoods.insertMany(json);
  }

  // 基于 大语言模型 (LLM) 的智能商品搜索功能
  async searchGoods(ctx) {
    console.log("搜索商品ing");
    const { userMessages } = ctx.request.body;
    await validate.nonEmptyString("userMessages", userMessages, "缺少用户对话");
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({
      apiKey: process.env.DASHSCOPE_API_KEY,
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    });
    // 1.调用 llm 进行关键词的提取
    const completion = await openai.chat.completions.create({
      model: "qwen-plus",
      messages: [
        {
          role: "system",
          content: process.env.KEYWORD_EXTRACTION_PROMPT,
        },
        {
          role: "user",
          content: `用户提问${userMessages}`,
        },
      ],
    });
    // console.log(completion);

    // 2.得到关键词
    const keyWords = completion.choices[0].message.content;
    console.log("keyWords:", keyWords);

    // 3.在数据库进行模糊查询
    if (keyWords != "null") {
      const queryConditions = JSON.parse(keyWords).map((item) => ({
        contentTitle: {
          $regex: new RegExp(item, "i"),
        },
      }));
      const res = await modelGoods.find({ $or: queryConditions }).limit(10);
      console.log(res);
      ctx.send(res);
    } else {
      ctx.send([]);
    }
  }

  // 根据商品id获取商品详情
  async goodsDetail(ctx) {
    const { goodsId } = ctx.query;
    await validate.nonEmptyString("goodsId", goodsId, "商品id不能为空");
    const res = await modelGoods.findById(goodsId);
    ctx.send(res);
  }
}
export default new GoodsController();
