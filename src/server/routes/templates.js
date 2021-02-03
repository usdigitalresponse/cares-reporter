/* eslint camelcase: 0 */

const express = require('express')
const fs = require('fs')
const { resolve } = require('path')
const { uploadFilename } = require('../lib/spreadsheet')

const router = express.Router()

function getAttachmentData(filename) {
  // template might be in source code repo
  let path = resolve(__dirname, '../data', filename)
  console.log('Checking path:', path);
  if (fs.existsSync(path)) {
    return fs.readFileSync(path)
  }
  // or it might have been uploaded by a user
  path = uploadFilename(filename)
  console.log('Checking path:', path);
  if (fs.existsSync(path)) {
    return fs.readFileSync(path)
  }
  return null;
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
