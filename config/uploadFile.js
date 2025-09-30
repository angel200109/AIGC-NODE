// 处理 form-data 文件的中间件
const multer = require("@koa/multer");

// 1. 定义磁盘存储的方式
const storage = multer.diskStorage({
  // 1.1 校验文件类型 定义存储位置
  destination: (req, file, cb) => {
    console.log(file);
    const fileType = ["image/png", "image/jpeg", "image/webp", "image/jpg"];
    if (!fileType.includes(file.mimetype)) {
      return cb({
        msg: "图片格式错误，仅支持 png/jpeg/webp/jpg",
        code: 442,
        validate: null,
      });
    }
    cb(null, "images/");
  },

  // 1.2 文件名称
  filename: (req, file, cb) => {
    const fileNameSplit = file.originalname.split(".");
    const newFileName = `${new Date().getTime()}.${
      fileNameSplit[fileNameSplit.length - 1]
    }`;
    cb(null, newFileName);
  },
});

const uploadFile = multer({ storage });
module.exports = uploadFile;
