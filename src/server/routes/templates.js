/* eslint camelcase: 0 */

const express = require('express')
const fs = require('fs')
const { resolve } = require('path')
const { uploadFilename } = require('../lib/spreadsheet')

const router = express.Router()

function getAttachmentData (filename) {
  // 21 03 24  reversed order of search to handle when the user uploads a new
  // template with the same name as the one in the source repo data/ directory

  // template might have been uploaded by a user
  let path = resolve(__dirname, '../data', filename)
  console.log('Checking path:', path)
  if (fs.existsSync(path)) {
    return fs.readFileSync(path)
  }
  // or it might be in source code repo
  path = uploadFilename(filename)
  console.log('Checking path:', path)
  if (fs.existsSync(path)) {
    return fs.readFileSync(path)
  }
  return null
}

router.get('/:filename', (req, res) => {
  const { filename } = req.params
  const data = getAttachmentData(decodeURIComponent(filename))
  if (!data) {
    res.sendStatus(404)
    res.end()
  } else {
    res.header(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    )
    res.header('Content-Type', 'application/octet-stream')
    res.end(Buffer.from(data, 'binary'))
  }
})

module.exports = router
