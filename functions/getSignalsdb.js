const db = require('./db')
const logger = require('../utils/logger')


async function getSignalTR(pair, timeframe) {
    await db.openDb()
    
    try {
        const sqlQuery = `
            SELECT value 
            FROM tr_signals 
            WHERE pair = ? AND timeframe = ?
            ORDER BY datetime DESC
            LIMIT 1;
        `

        const params = [pair, timeframe]
        const trSignal = await db.get(sqlQuery, params)

        if (!trSignal) {
            logger.error(`[❌] Не найдено TR сигналов на: ${pair}:${timeframe}`)
            return null
        }

        await db.closeDb()

        return {
            trValue: trSignal.value
        }
    } catch (err) {
        logger.error(`[❌] Error processing a condition request: ${err}`)
        return null
    }
    
}


async function getSignalMA(pair, timeframe) {
    await db.openDb()

    try {
        const sqlQuery = `
            SELECT value
            FROM ma_signals
            WHERE pair = ? AND timeframe = ?
            ORDER BY datetime DESC
            LIMIT 1;
        `

        const params = [pair, timeframe]
        const maSignal = await db.get(sqlQuery, params)

        if (!maSignal) {
            logger.error(`[❌] Не найдено MA сигналов на: ${pair}:${timeframe}`)
            return null
        }

        await db.closeDb()

        return {
            maValue: maSignal.value
        }

    } catch (err) {
        logger.error(`[❌] Error processing a condition request: ${err}`)
        return null
    }
}


module.exports = {
    getSignalTR,
    getSignalMA
}

