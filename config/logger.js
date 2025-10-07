import log4js from "log4js";

const levels = {
  trace: log4js.levels.TRACE,
  debug: log4js.levels.DEBUG,
  info: log4js.levels.INFO,
  warn: log4js.levels.WARN,
  error: log4js.levels.ERROR,
  fatal: log4js.levels.FATAL,
};

// 配置 log4js
log4js.configure({
  appenders: {
    // 输出到控制台
    console: { type: "console" },
    // info 日志输出到文件
    info: { type: "file", filename: "logs/info.log" },
    // error 日志按日期输出
    error: {
      type: "dateFile",
      filename: "logs/error.log",
      pattern: "yyyy-MM-dd.log",
      alwaysIncludePattern: true,
    },
  },
  categories: {
    default: { appenders: ["console"], level: "debug" },
    info: { appenders: ["console", "info"], level: "info" },
    error: { appenders: ["console", "error"], level: "error" },
  },
});

export const debug = (content) => {
  const logger = log4js.getLogger();
  logger.level = levels.debug;
  logger.debug(content);
};

export const info = (content) => {
  const logger = log4js.getLogger("info");
  logger.level = levels.info;
  logger.info(content);
};

export const warn = (content) => {
  const logger = log4js.getLogger("warn");
  logger.level = levels.warn;
  logger.warn(content);
};

export const error = (content) => {
  const logger = log4js.getLogger("error");
  logger.level = levels.error;
  logger.error(content);
};
