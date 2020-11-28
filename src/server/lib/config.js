const _ = require("lodash");

/*  makeConfig() returns a config object:
  {
    name: templateName, // "Agency Template" or "Treasury Template"
    settings: [
      {
        sheetName: key, // used by server
        tableName: key, // redundant
        columns: <array of column names>
      },
      ...
    ]
  }
  */
function makeConfig(
  allSheets,
  templateName = "Agency Template",
  ignoreSheets = [
    "Cover",
    "Cover Page",
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

/*  makeTemplate() returns a template object:
  {
    name: templateName, // "Agency Template" or "Treasury Template"
    type: "templates",
    sort_order: 0,
    content: <a config object, which also has the templateName>,
  }
  */
function makeTemplate(config, templateName = "Agency Template") {
  return {
    name: templateName,
    type: "templates",
    sort_order: 0,
    content: config
  };
}

/*  makeTables() returns an array:
    [
      { name: sheetName,
        type: "tables",
        sort_order: n,
        content: {
          name: sheetName,
          columns: [
            { name: <column name> },
            ...,
          ],
          relations: [],
        }
      },
      ...,
    ]
  */
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
