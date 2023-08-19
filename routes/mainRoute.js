const { Router } = require('express')
const router = Router()


const handleController = require('../modules/handleRequest')
router.post('/view', handleController.handleRequest)


module.exports = router