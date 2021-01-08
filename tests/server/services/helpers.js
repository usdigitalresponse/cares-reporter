const fs = require('fs')
const knex = requireSrc(`${__dirname}/../db/connection`)

const makeUploadArgs = fixtureFile => {
  const filename = fixtureFile.match(/[^/]+$/)[0]
  return {
    filename: filename,
    user_id: 1,
    data: fs.readFileSync(fixtureFile)
  }
}

const resetUploadsAndDb = async () => {
  fs.rmdirSync(process.env.UPLOAD_DIRECTORY, { recursive: true })
  fs.mkdirSync(process.env.UPLOAD_DIRECTORY)
  await knex('documents').truncate()
  await knex('validation_messages').del()
  await knex('uploads').del()
}

module.exports = { makeUploadArgs, resetUploadsAndDb }
