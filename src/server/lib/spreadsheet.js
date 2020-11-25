
const XLSX = require("xlsx");
const _ = require("lodash");
const { ValidationItem } = require("./validation-log");
const { applicationSettings, currentReportingPeriod } = require("../db");
const fixCellFormats = require("../services/fix-cell-formats");
const {
  categoryDescriptionSourceColumn,
  categoryMap,
  columnAliases,
  columnNameMap,
  columnTypeMap,
  sheetNameAliases,
  sheetNameMap,
} = require("./field-name-mapping")

/* loadSpreadsheet() returns an array containing:
  [
    { sheetName: <the name of this sheet (aka tab aka table)>,
      data: an array of JSON arrays, one for each row in the sheet [
        [col0value, col1value, col2value, ...],
        ...
      ]
    },
    ...
  ]
  */
function loadSpreadsheet(filename) {
  const workbook = XLSX.readFile(filename);
  return workbook.SheetNames.map(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    return {
      sheetName,
      data: XLSX.utils.sheet_to_json(sheet, { header: 1 })
    };
  });
}

/* sheetToJson() converts an XLSX sheet to a two dimensional JS array,
  (not really JSON). So the first element in the array will be an array
  of column names
  */
function sheetToJson(sheet, toLower = true) {
  const jsonSheet = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    blankrows: false
  });

  if (_.isEmpty(jsonSheet)) {
    return jsonSheet;
  }
  // jsonSheet[0] is an array of the column names (the first row in the sheet)
  if (toLower) {
    jsonSheet[0] = _.map(jsonSheet[0], colName => {
      const lowerCol = `${colName}`.toLowerCase().trim();
      return columnAliases[lowerCol] || lowerCol;
    });
  }
  return jsonSheet;
}

/*  parseSpreadsheet() verifies that the sheet and column names of the uploaded
  workbook match those of the reference template, and returns the contents
  of the uploaded workbook in a {<sheetName>: <two dimensional array>, ...}.
  */
function parseSpreadsheet(workbook, templateSheets) {
  const valog = [];

  const normalizedSheets = _.mapKeys(workbook.Sheets, (sheet, sheetName) => {
    return (
      sheetNameAliases[sheetName.toLowerCase().trim()]
      || sheetName.toLowerCase().trim()
    );
  });

  const parsedWorkbook = _.mapValues(
    normalizedSheets || {},
    (sheet) => {
      return sheetToJson( sheet);
    }
  );

  _.forIn(templateSheets, (templateSheet, sheetName) => {
    const workbookSheet = parsedWorkbook[sheetName];
    if (!workbookSheet) {
      return valog.push(
        new ValidationItem({
          message: `Missing tab "${sheetName}"`
        })
      );
    }

    const workbookColumns = workbookSheet[0];
    const templateColumns = templateSheet[0];
    const missingColumns = _.difference(templateColumns, workbookColumns);

    if (missingColumns.length === 1) {
      return valog.push(
        new ValidationItem({
          message: `Missing column "${missingColumns[0]}"`,
          tab: sheetName
        })
      );
    } else if (missingColumns.length > 1) {
      return valog.push(
        new ValidationItem({
          message: `Missing columns "${missingColumns.join('", "')}"`,
          tab: sheetName
        })
      );
    }
  });
  return { spreadsheet: parsedWorkbook, valog };
}

/*  spreadsheetToDocuments() returns an array of row objects consisting of:
   {  type:<sheet name>,
      user_id:<user ID>,
      content: {
        <column A title>:<cell contents>,
        <column B title>:<cell contents>,
        ...
      }
    }
  */
function spreadsheetToDocuments(
  spreadsheet, // { <sheet name>:<two dimensional array>, ... }
  user_id,
  templateSheets
) {
  const valog = [];
  const documents = [];
  _.forIn(templateSheets, (templateSheet, type) => {
    const sheet = spreadsheet[type];
    // This case noted as a validation error in `parseSpreadsheet`
    // but allow for checking of additional errors.
    if (!sheet) return;
    // These two are never needed for uploads.
    if (["Summary", "Dropdowns"].includes(type)) return;
    // These are mostly ignored, but may have some specific validations.
    if (type === "Cover") return;
    if (type === "Projects") return;
    if (type === "Agencies") return;
    // Mark any columns not in the template to be ignored
    const cols = sheet[0].map(col => {
      return templateSheet[0].includes(col) ? col : "ignore";
    });
    sheet.slice(1).forEach(row => {
      if (row.length === 0) return;
      documents.push({
        type,
        user_id,
        content: _.omit(_.zipObject(cols, row), ["ignore"])
      });
    });
  });
  return { documents, valog };
}

function uploadFilename(filename) {
  return `${process.env.UPLOAD_DIRECTORY}/${filename}`;
}

/*  createTreasuryOutputWorkbook() takes input records in the form of
      { <type (this is the source sheet name)>: [
          { content: {
              <sourceColumnName>:<sourceColumnValue>,
              ...
            }
          },
          ...
        ]
        ...
      }
    and composes these records into an output xlsx-formatted workbook.
  */
async function createTreasuryOutputWorkbook(
  wbSpec, // a config object - see config.js/makeConfig()
  recordGroups  // a KV object where keys are sheet names, values are arrays
          // of document records of this type (aka spreadsheet rows from
          // these sheets)
) {
  try {
    var appSettings = await applicationSettings() // eslint-disable-line
    // console.log("createTreasuryOutputWorkbook - appSettings are:");
    // console.dir(appSettings);
    /*  {
          title: 'Rhode Island',
          current_reporting_period_id: 1,
          reporting_template: null,
          duns_number: null
        }
    */

  } catch (err) {
    console.dir(err)
    return {}
  }

  try {
    var reportingPeriod = await currentReportingPeriod() // eslint-disable-line

  } catch (err) {
    console.dir(err)
    return {}
  }

  const workbook = XLSX.utils.book_new();

  // console.log(`wbSpec.settings is:`)
  // console.dir(wbSpec.settings);
  wbSpec.settings.forEach(outputSheetSpec => {
    let outputSheetName = outputSheetSpec.sheetName
    // console.log(`Composing outputSheet ${outputSheetName}`)
    let outputColumnNames = outputSheetSpec.columns
    // console.log(`Column names are ${outputColumnNames}`)
    // sometimes tabs are empty!
    let sheetRecords = recordGroups[sheetNameMap[outputSheetName]] || []
    console.dir(`Processing ${sheetRecords.length} ${outputSheetName} records`)

    let rows = [];
    switch (outputSheetName) {
      case "Cover Page":
        rows = getCoverPage(appSettings, reportingPeriod);
        break;

      case "Projects":
        rows = getProjectsSheet(sheetRecords, outputColumnNames);
        break;

      case "Contracts":
      case "Grants":
      case "Loans":
      case "Transfers":
      case "Direct":
        console.log(`${outputSheetName} has ${sheetRecords.length} records`)
        rows = getCategorySheet(outputSheetName, sheetRecords, outputColumnNames);
        console.log(`resulting in ${rows.length} rows`)
        break;

      case "Aggregate Payments Individual":
        rows = getAggregatePaymentsIndividualSheet(sheetRecords, outputColumnNames)
        break

      case "Sub Recipient":
        rows = getSubRecipientSheet(sheetRecords, outputColumnNames)
        break

      case "Aggregate Awards < 50000":
        rows = getAggregateAwardsSheet(sheetRecords, outputColumnNames)
        break

      default:
        throw new Error(`Unhandled sheet type: ${outputSheetName}`)
    }

    rows.unshift(outputColumnNames);

    let sheetOut = XLSX.utils.aoa_to_sheet(rows);
    sheetOut = fixCellFormats(sheetOut);

    XLSX.utils.book_append_sheet(workbook, sheetOut, outputSheetName);

  });
  try {
    // eslint-disable-next-line
    var treasuryOutputWorkbook =
      await XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  } catch (err) {
    console.dir(err)
  }
  return treasuryOutputWorkbook
}

function getCoverPage(appSettings = {}, reportingPeriod = {}) {
  console.dir(`typeof reportingPeriod.start_date is ${typeof reportingPeriod.start_date}`)
  let rows = [
    [
      "Financial Progress Reporting",
      "Coronavirus Relief Fund",

      reportingPeriod.start_date || "Needs a date",
      reportingPeriod.end_date || "Needs a date",
      appSettings.duns_number || "Needs a DUNS number"
    ]
  ];

  return rows;
}

function getProjectsSheet(sheetRecords, columns) {
  let projectIDColumnName = columnNameMap["Project Identification Number"]
  let rows =[]
  sheetRecords.forEach(jsRecord => {
    let jsRow = jsRecord.content
    let projectID = jsRow[projectIDColumnName]
    if( !projectID || projectID === "undefined" ) {
      // console.log("Bad project record:",jsRecord)
      return
    }
    let arrRow = columns.map(column => {
      const value = jsRow[columnNameMap[column]];
      return value ? value : null;
    });
    rows.push( arrRow );
  })
  return rows;
}

function getCategorySheet(
  sheetName,
  sheetRecords,  // an array of document records
  arrColumnNames // an array of output column names
) {

  let columnOrds = {}
  for ( let i = 0; i<arrColumnNames.length; i++ ) {
    columnOrds[arrColumnNames[i]] = i
  }

  let rowsOut = [];

  let amountColumnOrd = columnOrds["Cost or Expenditure Amount"]
  let categoryColumnOrd = columnOrds["Cost or Expenditure Category"]
  let descriptionColumnOrd = columnOrds["Category Description"]

  if (sheetName === "Loans" ) {
    amountColumnOrd = columnOrds["Payment Amount"]
    categoryColumnOrd = columnOrds["Loan Category"]
  }

  sheetRecords.forEach(jsonRecord => {
    let jsonRow = jsonRecord.content; // see exports.js/deduplicate()
    let arrRow =[]

    // populate the common fields
    arrColumnNames.forEach(columnName => {
      let cellValue = jsonRow[columnNameMap[columnName]]
      if ( cellValue ) {
        switch (columnTypeMap[columnName] ) {
          case "string":
            arrRow[columnOrds[columnName]] = String(cellValue)
            break
          default:
            arrRow[columnOrds[columnName]] = cellValue
            break
        }
      }
    } )

    let written = 0
    Object.keys(jsonRow).forEach(key => {
      let category = categoryMap[key] || null ;
      let destRow = arrRow.slice()

      switch (category) {
        case null:
        break

        case "Category Description":
          // ignore for now, we will populate it when we get to
          // "Other Expenditure Amount"
          break

        case "Items Not Listed Above":
          // If the column "other expenditure amount" is occupied in the
          // input row, put that amount in the Cost or Expenditure Amount
          // column, put "Items Not Listed Above" in the "Cost or
          // Expenditure Category" (or "Loan Category") column, and put the
          // contents of the "other expenditure categories" column in the
          // the "Category Description" column.
          destRow[amountColumnOrd] = jsonRow[key]
          destRow[categoryColumnOrd] = categoryMap[key]
          destRow[descriptionColumnOrd] = jsonRow[categoryDescriptionSourceColumn]
          rowsOut.push(destRow);
          written +=1
          break

        default: {
          destRow[amountColumnOrd] = jsonRow[key]
          destRow[categoryColumnOrd] = categoryMap[key]
          rowsOut.push(destRow);
          written += 1
          break
        }
      }
    });
    if (!written){
      // write a row even if there has been no activity in this period
      rowsOut.push(arrRow);
    }
  });
  return rowsOut;
}

function getAggregateAwardsSheet (sheetRecords) {


  let aggregate = {
    contracts:{updates:null,obligation:0,expenditure:0},
    grants:{updates:null,obligation:0,expenditure:0},
    loans:{updates:null,obligation:0,expenditure:0},
    transfers:{updates:null,obligation:0,expenditure:0},
    direct:{updates:null,obligation:0,expenditure:0},
  }

  sheetRecords.forEach( sourceRec => {
    let sourceRow = sourceRec.content
    let category = /Aggregate of (\w+)/.exec(sourceRow['funding type'])
    if (category) {
      category = category[1].toLowerCase()
    } else {
      console.log("Aggregate Awards record without a category!", sourceRow)
      return
    }
    // console.log(`${category}:${sourceRow}`)
    // console.dir(sourceRow)
    Object.keys(sourceRow).forEach(columnName => {

      switch (true) {
        case Boolean(/funding/.exec(columnName)):
          break

        case Boolean(/updates/.exec(columnName)):
          aggregate[category]["updates"] = sourceRow[columnName]
          break

        case Boolean(/obligation/.exec(columnName)):
          aggregate[category]["obligation"] += (Number(sourceRow[columnName]) || 0)
          break

        case Boolean(/expenditure/.exec(columnName)):
          aggregate[category]["expenditure"] += (Number(sourceRow[columnName]) || 0)
          break

        default:
          console.log(`column ${columnName} not recognized`)
          break
      }
    } )
  } )

  return [
    [ "Aggregate of Contracts Awarded for <$50,000",
      aggregate.contracts.obligation,
      aggregate.contracts.expenditure
    ],
    [ "Aggregate of Grants Awarded for <$50,000",
      aggregate.grants.obligation,
      aggregate.grants.expenditure
    ],
    [ "Aggregate of Loans Awarded for <$50,000",
      aggregate.loans.obligation,
      aggregate.loans.expenditure
    ],
    [ "Aggregate of Transfers Awarded for <$50,000",
      aggregate.transfers.obligation,
      aggregate.transfers.expenditure
    ],
    [ "Aggregate of Direct Payments Awarded for <$50,000",
      aggregate.direct.obligation,
      aggregate.direct.expenditure
    ],
  ];
}

function getAggregatePaymentsIndividualSheet (sheetRecords, outputColumnNames) {
  let cqoSourceName = columnNameMap["Current Quarter Obligation"];
  let cqeSourceName = columnNameMap["Current Quarter Expenditure"];

  let cqoTotal = 0;
  let cqeTotal = 0;

  sheetRecords.forEach( sourceRec => {
    cqoTotal += Number(sourceRec.content[cqoSourceName]) || 0;
    cqeTotal += Number(sourceRec.content[cqeSourceName]) || 0;
  } )

  let arrDestRow =[];
  arrDestRow[outputColumnNames.indexOf("Current Quarter Obligation")] = cqoTotal;
  arrDestRow[outputColumnNames.indexOf("Current Quarter Expenditure")] = cqeTotal;

  return [arrDestRow];
}

function getSubRecipientSheet (sheetRecords, outputColumnNames) {
  let dunsSourceName = columnNameMap["DUNS Number"];
  let idSourceName = columnNameMap["Identification Number"];

  // translate the JSON records in this sheet into AOA rows
  return _.map(sheetRecords, jsonRecord => {
    let jsonRow = jsonRecord.content

    // Treasury Data Dictionary says that if there is a DUNS number the ID
    // field should be empty. But we have some records where the DUNS number
    // field is occupied by junk, so we should ignore that.
    if ( jsonRow[dunsSourceName] ) {
      if (/^\d{9}$/.exec(jsonRow[dunsSourceName])){ // check for correct format
        delete jsonRow[idSourceName]

      } else if (jsonRow[idSourceName]) {
        delete jsonRow[dunsSourceName]
      }
    }
    // return an AOA row
    return outputColumnNames.map(columnName => {
      return jsonRow[columnNameMap[columnName]] || null
    });
  })
}


module.exports = {
  loadSpreadsheet,
  parseSpreadsheet,
  spreadsheetToDocuments,
  uploadFilename,
  createTreasuryOutputWorkbook,
  sheetToJson
};

/*                                  *  *  *                                   */
