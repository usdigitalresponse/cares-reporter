const path = require('path')
const { processUpload } = requireSrc(__filename)
const expect = require('chai').expect
const { makeUploadArgs } = require('./helpers')

const dirFixtures = path.resolve(__dirname, '../fixtures')
console.log(`dirFixtures is ${dirFixtures}`)
const s = path.resolve(__dirname, '../db/settings')
console.log(`pre-dirSettings is ${s}`)

const dirSettings = requireSrc(s)
console.log(`dirSettings is ${dirSettings}`)

const {
  setCurrentReportingPeriod
} = dirSettings
console.dir(setCurrentReportingPeriod)

describe('process-upload', () => {
  describe('certification', async () => {
    const dir = path.resolve(dirFixtures, 'data-certification')
    console.log(`dir is ${dir}`)
    it('fails when review name is missing', async () => {
      console.log('crungle')
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
