// 统一响应格式中间件
const responseHandler = async (ctx, next) => {
  ctx.send = (
    data = null,
    code = 200, // http 状态码
    msg = "SUCCESS",
    error = null,
    serviceCode = 200 // 服务端错误码
  ) => {
    // 前端在 response.json()里取
    ctx.body = {
      data,
      code, // http 状态码
      msg,
      error,
      serviceCode,
    };
    ctx.status = code; // http 状态码(前端是response.status取)
  };
  await next();
};

export default responseHandler;
