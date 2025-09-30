// 大模型的工具调用
const tools = [
  // 查询火车票
  {
    type: "function",
    function: {
      name: "get_train_tickets",
      description: `只要用户提出查询火车票或动车票相关的问题，你必须调用火车票查询工具。调用时必须包含出发地、目的地和日期三个参数，缺一不可。用户提供的日期必须是完整的年月日（如“2025年10月9日”），你需要将其转换为YYYY-MM-DD格式；如果用户未提供完整的年月日，你必须提醒用户补充完整日期。如果用户输入了带“省”或“市”的地点，你需要去掉，只保留城市名称，例如“云南省昆明市”要改成“昆明”。注意你不需要询问车票种类，也不需要判断日期是否合理，只要满足条件就直接触发工具调用。`,
      parameters: {
        type: "object",
        properties: {
          departure: {
            type: "string",
            description: "出发地",
          },
          destination: {
            type: "string",
            description: "目的地",
          },
          date: {
            type: "string",
            description: "日期",
          },
        },
        required: ["departure", "destination", "date"],
      },
    },
  },

  // 查询天气
  {
    type: "function",
    function: {
      name: "get_weather",
      description: `只要用户询问查询天气时，你就应该触发该工具调用，帮助用户查询某个城市的天气，
      你不能使用你自己给出的天气数据，因为那是不准确的，需要用户提供一个城市名就可以，这个城市名必须提供，
      否则不能触发函数调用，你需要提示用户:比如你可以这样问我哦!昆明市的天气如何!’,但有可能用户会提供区县名，
      这时候需要你自行判断该区县属于哪个城市，比如用户提供玉龙雪山，那么玉龙雪山属于丽江，那只需要丽江这个城市名，
      但是如果你不能100%的判断该区县属于哪个城市，请不要随意给出城市名，你需要告诉用户提供准确的城市名"，`,
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "城市名，比如大理市，昆明市，丽江市等",
          },
        },
        required: ["city"],
      },
    },
  },
];
module.exports = tools;
