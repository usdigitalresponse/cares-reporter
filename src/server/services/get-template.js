
let log = () => {}
if (process.env.VERBOSE) {
  log = console.dir
}

let path = require('path')

const fs = require('fs')
const xlsx = require('xlsx')
const _ = require('lodash')
const { sheetToJson } = require('../lib/spreadsheet')

let treasury = {
  template: null,
  sheets: null
}

let validation = {
  template: null,
  sheets: null,
  dropdownValues: null
}

module.exports = {
  getDropdownValues,
  getTreasuryTemplateSheets,
  getValidationTemplateSheets
}

function getDropdownValues () {
  if (!validation.dropdownValues) {
    loadValidationTemplate()
  }
  return validation.dropdownValues
}

function getTreasuryTemplateSheets () {
  if (!treasury.sheets) {
    loadTreasuryTemplate()
  }
  return treasury.sheets
}

function loadTreasuryTemplate () {
  let xlsxTemplate = loadXlsxFile(process.env.TREASURY_TEMPLATE)
  const objAoaSheets = {}

  _.keys(xlsxTemplate.Sheets).forEach(sheetName => {
    const rawSheet = xlsxTemplate['Sheets'][sheetName]
    objAoaSheets[sheetName] = sheetToJson(rawSheet, false)
  })

  treasury.template = xlsxTemplate
  treasury.sheets = objAoaSheets
}

function getValidationTemplateSheets () {
  if (!validation.sheets) {
    loadValidationTemplate()
  }
  return validation.sheets
}

function loadXlsxFile (fileName) {
  let filePath = path.resolve(__dirname, `../data/${fileName}`)
  // console.log(`loadTreasuryTemplate: filePath is |${filePath}|`);

  return xlsx.read(fs.readFileSync(filePath), { type: 'buffer' })
}

function loadDropdownValues () {
  let dropdownTab = validation.template.Sheets.Dropdowns
  const dropdownSheet = xlsx.utils.sheet_to_json(dropdownTab, {
    header: 1,
    blankrows: false
  })
  const dropdownValues = _.fromPairs(
    _.zip(
      // zip to pair each column name with array of values for each column
      _.map(dropdownSheet[1], _.toLower), // second row is the column name
      _.map(
        // zip to convert each column to an array of values for each column
        // (matrix transpose)
        _.zip(...dropdownSheet.slice(2)),
        // pipe each column array into a map that compacts each array and
        // lowercases values
        colAr => _.map(_.compact(colAr), _.toLower)
      )
    ).slice(1)
  )
  return dropdownValues
}

function loadValidationTemplate () {
  let xlsxTemplate = loadXlsxFile(process.env.VALIDATION_TEMPLATE)
  const objAoaSheets = {}

  _.keys(xlsxTemplate.Sheets).forEach(tabName => {
    if (tabName === 'Dropdowns') return
    const sheetName = tabName.toLowerCase().trim()
    const templateSheet = _.get(xlsxTemplate, ['Sheets', tabName])
    objAoaSheets[sheetName] = sheetToJson(templateSheet)
  })

  validation.template = xlsxTemplate
  validation.sheets = objAoaSheets
  log(`Validation template loaded...`)

  validation.dropdownValues = loadDropdownValues()
  log(`Dropdown values loaded...`)
  delete validation.sheets.Dropdowns
  return 'OK'
}

/*                                 *  *  *                                    */
