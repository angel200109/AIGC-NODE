const Router = require("@koa/router");
const router = new Router();

// 用户相关
const user = require("@/controller/userController.js");
router.get("/getU", user.getUser); // 获取用户信息
router.post("/postU", user.postUser); // 提交用户信息

// 接口1：用户发送信息
const chat = require("@/controller/chatController.js");
router.post("/chatMessage", chat.chatMessage);

// 接口2：文件上传
const uploadFile = require("@/config/uploadFile"); // 导入处理 form-data 的中间件
router.post("/uploadFile", uploadFile.single("file"), chat.uploadFile);

// 接口3：查询天气
// 接口4：查询火车票
const tool = require("@/controller/callToolController.js");
router.post("/queryTrainTicket", tool.queryTrainTicket);
router.get("/queryWeather", tool.queryWeather);

import goods from "./GoodsController.js";
router.get("/addGoods", goods.addGoods);
module.exports = router;
