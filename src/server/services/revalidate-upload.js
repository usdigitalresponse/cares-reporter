/* eslint camelcase: 0 */

const fs = require('fs')
const { upload: getUpload } = require('../db')
const { validateUpload } = require('./validate-upload')

const revalidateUpload = async uploadId => {
  const upload = await getUpload(uploadId)
  if (!upload) {
    return null
  }
  const { filename, user_id, agency_id } = upload
  const data = fs.readFileSync(`${process.env.UPLOAD_DIRECTORY}/${upload.filename}`)
  const {
    valog
  } = await validateUpload({ filename, user_id, agency_id, data })

  return valog
}

module.exports = { revalidateUpload }
