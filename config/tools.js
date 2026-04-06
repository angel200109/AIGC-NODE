const tools = [
  // 查询火车票
  {
    type: "function",
    function: {
      name: "get_train_tickets",
      description: `只要用户提出查询火车票、动车票、高铁票、城际列车的问题，你就应该调用火车票查询工具。调用时必须包含出发地和目的地两个参数。date 是可选参数：如果用户明确提供了日期，你需要将其转换为 YYYY-MM-DD 格式后传入；如果用户没有明确提供日期，就不要传 date，让接口默认查询当天。ishigh 是可选参数：如果用户明确表示“只看高铁”，传 1；如果用户明确表示“不要高铁/普通列车”，传 0；如果用户没有说明，则不要传。用户输入地点时如果带有“省”或“市”，你可以去掉这些后缀，只保留核心地名。`,
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
          ishigh: {
            type: "string",
            description:
              "可选，是否筛选高铁。传1表示高铁，传0表示非高铁；未明确说明时不要传",
          },
          date: {
            type: "string",
            description:
              "可选，日期，格式为YYYY-MM-DD；如果用户未明确提供日期，则不要传",
          },
        },
        required: ["departure", "destination"],
      },
    },
  },

  // 查询天气
  {
    type: "function",
    function: {
      name: "get_weather",
      description: `只要用户询问查询天气时，你就应该触发该工具调用，帮助用户查询某个城市的天气。
      你不能使用你自己给出的天气数据，因为那是不准确的，需要用户提供一个城市名就可以，这个城市名必须提供，
      否则不能触发函数调用。你需要提示用户: 比如你可以这样问我哦! 昆明市的天气如何! 
      但有可能用户会提供区县名，这时候需要你自行判断该区县属于哪个城市，比如用户提供玉龙雪山，那么玉龙雪山属于丽江，那只需要丽江这个城市名。但是如果你不能100%判断该区县属于哪个城市，请不要随意给出城市名，你需要告诉用户提供准确的城市名。`,
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

export default tools;
