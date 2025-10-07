import { Schema, model, mongoose } from "@/config/database.js";
import dayjs from "dayjs";
// 定义商品的字段
const GoodsSchema = new Schema(
  {
    coverImage: {
      type: String,
      required: true,
    },
    contentTitle: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    productImages: {
      type: [String],
      required: true,
    },
    createTime: {
      type: String,
      default: () => dayjs().format("YYYY-MM-DD HH:mm:ss"),
    },
  },
  { versionKey: false }
);
const modelGoods = model("goods", GoodsSchema);
export default modelGoods;
