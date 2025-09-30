const log4js = require("log4js");
const levels = {
  trace: log4js.levels.TRACE,
  debug: log4js.levels.DEBUG,
  info: log4js.levels.INFO,
  warn: log4js.levels.WARN,
  error: log4js.levels.ERROR,
  fatal: log4js.levels.FATAL,
};
// 对log4js进行配置
log4js.configure({
  appenders: {
    // 输出到控制台
    console: {
      type: "console",
    },
    // 将info级别的日志输出到名为info.log的文件中
    info: {
      type: "file",
      filename: "logs/info.log",
    },
    // 将error级别的日志按日期输出到名为error-yyyy-MM-dd.log的文件中
    error: {
      type: "dateFile",
      filename: "logs/error.log",
      pattern: "yyyy-MM-dd.log",
      alwaysIncludePattern: true,
    },
  },

  // 定义了不同的日志分类及其配置，不同的日志类别可以有不同的输出方式和日志级别
  categories: {
    // 默认分类，将日志输出到控制台，日志类别为debug
    default: {
      appenders: ["console"],
      level: "debug",
    },
    // 名为info的日志类别，将日志同时输出到文件和控制台，日志级别为info
    info: {
      appenders: ["console", "info"],
      level: "info",
    },
    // 名为error的日志类别，将日志同时输出到文件和控制台，日志级别为error
    error: {
      appenders: ["console", "error"],
      level: "error",
    },
  },
});

exports.debug = (content) => {
  let logger = log4js.getLogger();
  logger.level = levels.debug;
  logger.debug(content);
};

exports.info = (content) => {
  let logger = log4js.getLogger("info");
  logger.level = levels.info;
  logger.info(content);
};

//警告
exports.warn = (content) => {
  let logger = log4js.getLogger("warn");
  logger.level = levels.warn;
  logger.warn(content);
};

//错误
exports.error = (content) => {
  let logger = log4js.getLogger("error");
  logger.level = levels.error;
  logger.error(content);
};
