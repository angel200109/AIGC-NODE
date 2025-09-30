// 1. 加载配置和基础库
require("dotenv").config(); // 加载环境变量
const Koa = require("koa");
const json = require("koa-json");
const bodyParser = require("koa-bodyparser");
const cors = require("@koa/cors");
const static = require("koa-static");
const path = require("path");
const app = new Koa();

// 2. 设置路径别名
const { addAlias } = require("module-alias");
addAlias("@", __dirname); // 设置文件别名，@映射为根目录

// 3. 注册中间件
const errorHandler = require("@/config/errorHandler.js");
app.use(errorHandler); // 异常捕获中间件
const responseHandler = require("./config/responseHandler.js");
app.use(responseHandler); // 自定义响应格式中间件

// 4. 注册第三方中间件
app.use(cors()); // 允许前端浏览器从"不同域名"访问你的后端（解决跨域问题）
app.use(bodyParser()); // 自动解析POST、PUT请求中的数据，并挂到ctx.request.body
app.use(json()); // 服务器返回的数据变成JSON格式
app.use(static(path.join(__dirname))); // 静态资源目录，访问/images/xxx.jpg可以访问到images目录下的xxx.jpg文件

// 5. 注册路由
const router = require("@/routes/index.js");
app.use(router.routes()).use(router.allowedMethods());

// 6. 启动服务
app.listen(3000, () => {
  console.log("✅ Koa server running at http://localhost:3000");
});
