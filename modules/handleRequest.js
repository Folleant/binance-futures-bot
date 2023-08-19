const logger = require('../utils/logger')
const db = require('../functions/db')
const { processingRequest } = require('./processingRequest')


const handleRequest = async (req, res) => {
    try {
        const requestData = req.body

        if (!requestData) {
            return res.status(400).json({ error: '[❌] No request data provided' })
        }

        let requestArray = requestData

        if (!Array.isArray(requestArray)) {
            const signleRequest = [requestArray]
            await processRequests(signleRequest)
        } else {
            await processRequests(requestArray)
        }

        res.status(200).json({ message: '[✔️] Request successfully received and processed' })
    } catch (err) {
        logger.error(`[❌] Error in handling request: ${err}`);
        res.status(500).send(`[❌] Error in receiving and processing the request ${err}`)
    }
}

async function processRequests(requestArray) {
    await db.openDb()

    for (const requestObject of requestArray) {
        try {
            const [exchange, pair, timeframe, indicator, value] = requestObject.split(' ')
            logger.info('[✔️] Запрос был получен, обрабатываем...')
            console.log(exchange, pair, timeframe, indicator, value)

            if (exchange !== "BINANCE") {
                logger.error(`[❌] Проверка валидности биржы, неподдерживаемое значение ${exchange}`)
                return res.status(400).send({ error: '[❌] Unsupported exchange ${exchange}' })
            } else {
                logger.info(`[✔️] Проверка валидности биржы, успешно ${exchange}`)
            }

            if (!['SI', 'TR', 'MA'].includes(indicator)) {
                logger.error(`[❌] Проверка валидности индикатора, неподдерживаемое значение ${exchange}`)
                return res.status(400).send({ error: '[❌] Unsupported indicator' })
            } else {
                logger.info(`[✔️] Проверка валидности индикатора, успешно ${indicator}`)
            }

            if (['TR', 'MA'].includes(indicator)) {
                logger.info(`[✔️] Запрос с индикатором: ${indicator}`)
                await db.saveSignals(exchange, pair, timeframe, indicator, value)
                logger.info(`[✔️] Сохранение запроса в базу данных [${indicator}], успешно`)
            } else if (indicator === 'SI') {
                logger.info(`[✔️] Запрос с индикатором: ${indicator}`)
                await db.saveSignals(exchange, pair, timeframe, indicator, value)
                logger.info(`[✔️] Сохранение запроса в базу данных [${indicator}], успешно`)
                await processingRequest(exchange, pair, timeframe, indicator, value)
            } else {
                logger.error('[❌] Неизвестный индикатор, ошибка');
            }

        } catch (err) {
            logger.error(`[❌] Ошибка при обработке запроса: ${err}`)
        }
    }

    await db.closeDb()

}

module.exports = { handleRequest }