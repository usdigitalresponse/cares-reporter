const _ = require("lodash");

function makeConfig(
  allSheets,
  templateName = "Agency Template",
  ignoreSheets = [
    "Cover",
    "Dropdowns",
    "Summary",
    "Projects",
    "cover",
    "cover page",
    "dropdowns",
    "summary",
    "projects"
  ]
) {
  const sheets = _.omit(allSheets, ignoreSheets);
  return {
    name: templateName,
    settings: _.map(sheets, (value, key) => {
      return {
        sheetName: key,
        tableName: key,
        columns: value[0]
      };
    })
  };
}

function makeTemplate(content, templateName = "Agency Template") {
  return {
    name: templateName,
    type: "templates",
    sort_order: 0,
    content
  };
}

function makeTables(config) {
  return config.settings.map((sheet, n) => {
    const name = sheet.sheetName;
    return {
      name,
      type: "tables",
      sort_order: n,
      content: {
        name,
        columns: _.map(sheet.columns, name => {
          return {
            name: name
          };
        }),
        relations: []
      }
    };
  });
}

module.exports = {
  makeConfig,
  makeTables,
  makeTemplate
};
