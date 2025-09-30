const logger = require("@/config/logger");
const errorHandler = async (ctx, next) => {
  try {
    await next();
    logger.info(`输出日志：${ctx.method} ${ctx.url}`);
  } catch (errorData) {
    logger.error(errorData); // 把错误记录到日志中
    if (errorData.validate === null) {
      const { code, msg } = errorData;
      ctx.send(null, code, msg);
    } else if (errorData.message === "Unexpected field") {
      // 图片上传时，file字段有错误
      ctx.send(null, 442, "上传字段名错误，应为 file");
    } else if (errorData.message === "Field name missing") {
      // 图片上传时，图片和file字段均没有上传
      ctx.send(null, 442, "未检测到上传文件，请检查字段名和图片是否正确");
    } else {
      // 处理其他异常
      console.log(errorData.message);
      const error = errorData.message || "异常错误，请查看服务器端日志";
      const status = errorData.status || error.serviceCode || 500;
      ctx.send(null, status, "服务器端异常错误", error);
    }
  }
};
module.exports = errorHandler;
