const validate = require("../utils/validate");

class UserController {
  async getUser(ctx) {
    if (ctx.query.name == "angel") {
      ctx.send({
        data: {
          name: "angel",
          age: 24,
          school: "Gzhu",
        },
      });
    }
    console.log("返回get请求的数据");
  }

  async postUser(ctx) {
    const { name, age } = ctx.request.body;
    await validate.nonEmptyString("name", name, "请填写姓名");
    await validate.nonEmptyString("age", age, "请填写年龄");
    ctx.send("成功收到数据", 200, "请求成功");
  }
}
module.exports = new UserController();
