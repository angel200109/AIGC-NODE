import mongoose from "mongoose";
import config from "../default.js";

mongoose.pluralize(null);
const { Schema, model } = mongoose;
mongoose
  .connect(config.dbUrl.host)
  .then((res) => {
    console.log("数据库连接成功");
  })
  .catch((err) => {
    console.log(err);
    console.log("数据库连接失败");
  });
export { Schema, model, mongoose };
