class Validate {
  // 必填字段验证
  async requireField(fieldName, value) {
    if (value === undefined) {
      throw { msg: `缺少${fieldName}字段`, code: 400, validate: null };
    }
  }

  //  非空字符串验证
  async nonEmptyString(fieldName, value, tips) {
    console.log(`验证字段: ${fieldName}, 值: ${value}`);

    await this.requireField(fieldName, value);
    if (typeof value !== "string") {
      throw {
        msg: `${fieldName}字段的值必须是字符串类型`,
        code: 400,
        validate: null,
      };
    }
    if (value.trim() === "") {
      throw { msg: tips, code: 422, validate: null };
    }
  }

  // 非空数组验证
  async isArray(fieldName, value, tips) {
    await this.requireField(fieldName, value);
    if (!Array.isArray(value)) {
      throw {
        msg: `${fieldName}字段的值必须是数组类型`,
        code: 400,
        validate: null,
      };
    }
    if (value.length <= 0) {
      throw { msg: tips, code: 422, validate: null };
    }
  }
}
module.exports = new Validate();
