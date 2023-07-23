const { processingHandleRequest } = require('../services/tradingBotService')
const logger = require('../modules/logging/logger')


const processingTradingViewRequest = async (req, res) => {
    try {
        //const [ exchange, pair, timeframe, indicator, value ] = req.body.split(' ') ошибка зависает и не обрабатывает запрос при получение просто данных: 'BINANCE LTCUSDT 3h TR -0.0336038195263384'

        const { exchange, pair, timeframe, indicator, value } = req.body
        logger.info(`✔️ Успешно получен запрос с данными:
            Биржа: [${exchange}]
            Пара: [${pair}]
            Таймфрейм: [${timeframe}]
            Индикатор: [${indicator}]
            Значение: [${value}]
        `)

        // Обработка полученных данных
        if (exchange !== 'BINANCE') {
            logger.error(`❌ Неизвестная биржа: [${exchange}]`)
            return res.status(400).send({
                error: 'Error: Unsupported exchange'
            })
        } else {
            logger.info(`✔️ Биржа правильно установлена: [${exchange}]`)
        }
        if (!['SI', 'TR', 'MA'].includes(indicator)) {
            logger.error(`❌ Неизвестный индикатор: [${indicator}]`)
            return res.status(400).send({
                error: 'Error: Unsupported indicators'
            })
        } else {
            logger.info(`✔️ Индикатор правильно установлен: [${indicator}]`)
        }

        // Quantity - Сумма сделки
        let quantity = 10

        processingHandleRequest(
            pair,
            timeframe,
            indicator,
            value,
            quantity
        )

        res.status(200).json({ message: "Trading View signal processed" })
    } catch (err) {

    }
}



module.exports = { processingTradingViewRequest }