const path = require('path')
const { processUpload } = requireSrc(__filename)
const expect = require('chai').expect
const { makeUploadArgs } = require('./helpers')

const dirFixtures = path.resolve(__dirname, '../fixtures')
const s = path.resolve(__dirname, '../db/settings')

const dirSettings = requireSrc(s)

const {
  setCurrentReportingPeriod
} = dirSettings

describe('process-upload', () => {
  describe('certification', async () => {
    const dir = path.resolve(dirFixtures, 'data-certification')
    it('fails when reviewer name is missing', async () => {
      await setCurrentReportingPeriod(1)
      const uploadArgs = makeUploadArgs(
        path.resolve(dir, 'EOHHS-075-09302020-no-reviewer-v1.xlsx')
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
