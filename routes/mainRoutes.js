const { Router } = require('express')

const router = Router()

const tradingBotController = require('../controllers/tradingBotController')


router.post('/view', tradingBotController.processingTradingViewRequest)


module.exports = router
