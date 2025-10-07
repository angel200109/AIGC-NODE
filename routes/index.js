import Router from "@koa/router";
import user from "@/controller/userController.js";
import chat from "@/controller/chatController.js";
import uploadFile from "@/config/uploadFile.js";
import tool from "@/controller/callToolController.js";
import goods from "@/controller/goodsController.js";

const router = new Router();

// 用户接口
router.get("/getU", user.getUser); // 获取用户信息
router.post("/postU", user.postUser); // 提交用户信息

// 聊天接口
router.post("/chatMessage", chat.chatMessage);

// 文件上传接口
router.post("/uploadFile", uploadFile.single("file"), chat.uploadFile);

// 工具接口
router.post("/queryTrainTicket", tool.queryTrainTicket);
router.get("/queryWeather", tool.queryWeather);

// 商品接口
router.get("/addGoods", goods.addGoods);
router.get("/goodsDetail", goods.goodsDetail);
router.post("/searchGoods", goods.searchGoods);

export default router;
