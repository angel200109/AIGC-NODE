import validate from "@/utils/validate.js";
import axios from "axios";

const queryTrainTicketUrl =
  "https://jisutrain.market.alicloudapi.com/train/station2s";
const queryWeatherUrl = "https://ali-weather.showapi.com/day15";

class CallToolController {
  // -----------------查询火车票-----------------
  async queryTrainTicket(ctx) {
    const { departure, destination, date } = ctx.request.body;
    await validate.nonEmptyString("departure", departure, "出发地不能为空");
    await validate.nonEmptyString("destination", destination, "目的地不能为空");
    await validate.nonEmptyString("date", date, "日期不能为空");
    try {
      const res = await axios.get(queryTrainTicketUrl, {
        params: { start: departure, end: destination, date },
        headers: {
          Authorization: `APPCODE ${process.env.appCode}`,
        },
      });
      ctx.send(res.data.result.list);
    } catch (error) {
      console.error(error);
      const status = ["201", "203"];
      if (status.includes(error.response?.data?.status)) {
        ctx.send(
          [],
          200,
          "非常抱歉，没有查询到对应的车票信息，你可以重新试试哦!",
          null,
          201
        );
      } else {
        throw {
          msg: "查询火车票出现异常错误",
          code: 400,
          validate: null,
        };
      }
    }
  }

  // -----------------查询天气-----------------
  async queryWeather(ctx) {
    const { city } = ctx.query;
    await validate.nonEmptyString("city", city, "城市不能为空");
    try {
      const res = await axios.get(queryWeatherUrl, {
        params: { area: city },
        headers: {
          Authorization: `APPCODE ${process.env.appCode}`,
        },
      });
      ctx.send(res.data.showapi_res_body.dayList);
    } catch (error) {
      if (error.response?.status === 450 && error.response?.data) {
        ctx.send(
          [],
          200,
          "非常抱歉，没有查询到该城市的天气，你可以重新试试哦",
          null,
          201
        );
      } else {
        throw {
          msg: "查询天气出现异常错误",
          code: 400,
          validate: null,
        };
      }
    }
  }
}

export default new CallToolController();
