/* eslint no-unused-expressions: "off" */

const XLSX = require('xlsx')
const { sheetToJson } = requireSrc(__filename)
const expect = require('chai').expect

describe('services/lib/spreadsheet', () => {
  it('can handle empty sheet', async () => {
    const sheet = XLSX.utils.aoa_to_sheet([])
    const j = sheetToJson(sheet, true)
    expect(j).to.be.empty
  })
  it('can handle non string column names', async () => {
    const rows = [['foo', 'bar', 123.45]]
    const sheet = XLSX.utils.aoa_to_sheet(rows)
    const j = sheetToJson(sheet, true)
    expect(j[0][2]).to.equal('123.45')
  })
})
