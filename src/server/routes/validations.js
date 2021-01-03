const express = require('express')

const router = express.Router()
const { requireUser } = require('../access-helpers')
const { revalidateUpload } = require('../services/revalidate-upload')

router.get('/', requireUser, async function (req, res) {
  return res.json({ validations: [] })
})

router.post('/:id', requireUser, async (req, res, next) => {
  const { id } = req.params
  console.log(`POST /validations/${id}`)
  try {
    const valog = await revalidateUpload(parseInt(id))
    if (valog === null) {
      res.sendStatus(400)
      res.end()
    } else {
      res.json({
        success: valog.success(),
        errors: valog.getLog()
      })
    }
  } catch (e) {
    res.json({
      success: false,
      errors: [{ message: e.message }]
    })
  }
})

module.exports = router
