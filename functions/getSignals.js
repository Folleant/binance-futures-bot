const fs = require('fs')
const logger = require('../utils/logger')
const { indicatorsJSON } = require('../modules/jsonRequest')


async function getSignalTR(pair, timeframe) {
    const indicatorsData = indicatorsJSON()
    const trData = fs.readFileSync(indicatorsData.TR, 'utf8')
    const trSignalParse = JSON.parse(trData)

    const trSignal = trSignalParse.find(s =>
        s.pair === pair &&
        s.timeframe === timeframe
    )

    if (!trSignal) {
        logger.error(`No TR signal found for pair ${pair} and timeframe ${timeframe}`)
        return
    }

    return {
        engine: trSignal,
        trValue: trSignal.value
    }
}


async function getSignalMA(pair, timeframe) {
    const indicatorsData = indicatorsJSON()
    const maData = fs.readFileSync(indicatorsData.MA, 'utf8')
    const maSignalParse = JSON.parse(maData)

    const maSignal = maSignalParse.find(s =>
        s.pair === pair &&
        s.timeframe === timeframe
    )

    if (!maSignal) {
        logger.error(`No TR signal found for pair ${pair} and timeframe ${timeframe}`)
        return
    }

    return {
        maValue: maSignal.value
    }
}


module.exports = {
    getSignalTR,
    getSignalMA
}