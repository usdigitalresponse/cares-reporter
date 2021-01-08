/* eslint no-unused-expressions: "off" */

let { processUpload } = requireSrc(__filename)

const expect = require('chai').expect
const { makeUploadArgs } = require('./helpers')

const dirRoot = `${__dirname}/../fixtures/`

describe('services/process-upload', () => {
  describe('contracts', () => {
    const dir = `${dirRoot}data-contracts/`
    it('fails with a bad subrecipient id', async () => {
      const uploadArgs = makeUploadArgs(
        `${dir}/EOHHS-075-09302020-bad_sub_id-v1.xlsx`
      )
      const result = await processUpload(uploadArgs)
      // console.dir(result.valog.getLog());
      const err = result.valog.getLog()[0] || {}
      expect(err.message, `File ${uploadArgs.filename}`).to.match(
        /Each contract row must have a "subrecipient id" which is included in the "subrecipient" tab/
      )
      expect(err.row).to.equal(3)
    })

    it('fails with a bad project id', async () => {
      const uploadArgs = makeUploadArgs(
        `${dir}/EOHHS-075-09302020-bad_proj_id-v1.xlsx`
      )
      const result = await processUpload(uploadArgs)
      const err = result.valog.getLog()[0] || {}
      expect(err.message, `File ${uploadArgs.filename}`).to.equal(
        'The contract project id "666" does not match the project id in the filename'
      )
      expect(err.row).to.equal(4)
    })

    it('ignores expenditure dates for zero expenditure amount', async () => {
      const uploadArgs = makeUploadArgs(
        `${dir}/EOHHS-075-09302020-noexpenditures-v1.xlsx`
      )
      const result = await processUpload(uploadArgs)
      expect(
        result.valog.getLog(),
        JSON.stringify(result.valog.getLog(), null, 2)
      ).to.be.empty
    })
  })
})

/*                                 *  *  *                                    */
