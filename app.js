// 1. 加载配置和基础库
import "dotenv/config.js"; // 加载环境变量
import Koa from "koa";
import json from "koa-json";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import serve from "koa-static";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import "@/config/database.js";

const app = new Koa();

// __dirname 替代写法 (因为 ESM 没有内置 __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// // 2. 设置路径别名 (注意：module-alias 在 ESM 下用不了，建议用 import-alias / tsconfig paths)
// import { addAlias } from "module-alias";
// addAlias("@", __dirname);

// 3. 注册中间件
import errorHandler from "@/config/errorHandler.js";
app.use(errorHandler);

import responseHandler from "./config/responseHandler.js";
app.use(responseHandler);

// 4. 注册第三方中间件
app.use(cors());
app.use(bodyParser()); // 自动将json数据转为js对象
app.use(json());
app.use(serve(path.join(__dirname))); // 静态资源目录

// 5. 注册路由
import router from "@/routes/index.js";
app.use(router.routes()).use(router.allowedMethods());

// 6. 启动服务
app.listen(3000, () => {
  console.log("✅ Koa server running at http://localhost:3000");
});
