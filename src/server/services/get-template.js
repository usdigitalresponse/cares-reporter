const fs = require("fs");
const xlsx = require("xlsx");

const template = xlsx.read(
  fs.readFileSync(`${__dirname}/../data/${process.env.REPORTING_TEMPLATE}`)
);

const getTemplate = () => {
  return template;
};

module.exports = { getTemplate };
