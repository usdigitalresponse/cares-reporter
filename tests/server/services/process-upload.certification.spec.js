const { processUpload } = requireSrc(__filename)
const expect = require('chai').expect
const { makeUploadArgs } = require('./helpers')

const dirRoot = `${__dirname}/../fixtures/`

const {
  setCurrentReportingPeriod
} = requireSrc(`${__dirname}/../db/settings`)

describe('process-upload', () => {
  describe('certification', async () => {
    const dir = `${dirRoot}data-certification`
    it('fails when review name is missing', async () => {
      await setCurrentReportingPeriod(1)
      const uploadArgs = makeUploadArgs(
        `${dir}/EOHHS-075-09302020-no-reviewer-v1.xlsx`
      )
      const result = await processUpload(uploadArgs)
      const err = result.valog.getLog()[0] || {}
      expect(err.message).to.equal(
        'Agency financial reviewer name must not be blank'
      )
    })
  })
})

/*                                 *  *  *                                    */
