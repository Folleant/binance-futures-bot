const logger = require('../utils/logger')
const { processingRequest } = require('./processingRequest')
const { checkingJsonRequest } = require('./jsonRequest')


const handleRequest = async (req, res) => {
    try {
        // Receives and processes POST request
        const { exchange, pair, timeframe, indicator, value } = req.body
        logger.info('✔️ Successfully received the request')

        // Check the validity of the obtained data
        if (exchange !== 'BINANCE') {
            logger.error('❌ Exchange type invalid')
            return res.status(400).send({ error: 'Error: Unsupported exchange' })
        } else {
            logger.info(`✔️ Exchange type valid: ${exchange}`)
        }

        if (!['SI', 'TR', 'MA'].includes(indicator)) {
            logger.error('❌ Indicator type invalid')
            return res.status(400).send({ error: 'Error: Unsupported indicator' })
        } else {
            logger.info(`✔️ Indicator type valid: ${indicator}`)
        }

        await checkingJsonRequest(exchange, pair, timeframe, indicator, value)

        // Initialize the start of condition checking when SI signal is received
        await processingRequest(exchange, pair, timeframe, indicator, value) // no await

        res.status(200).json({ message: 'Request successfully processed' })

    } catch (err) {
        logger.error('❌ Request processing error', err)
        res.status(500).send('Error: Request processing error')
    }
}


module.exports = { handleRequest }