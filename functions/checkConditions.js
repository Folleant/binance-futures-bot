const db = require('../functions/db')
const logger = require('../utils/logger')
const binance = require('../utils/binance')
const { getSignalTR, getSignalMA } = require('./getSignalsdb')



async function checkConditions(pair, timeframe, value) {
    let allConditionsPassed = true

    /* Сигнал противоположен направлению тренда 1d */
    const trSignal1d = await getSignalTR(pair, '1d')

    if ((value === 'BUY' && trSignal1d.trValue < 0) ||
        (value === 'SELL' && trSignal1d.trValue > 0)
    ) {
        logger.info(`[✔️] [1] Сигнал противоположен направлению тренда 1d, условие выполнено ${value}:${trSignal1d.trValue}`)
    } else {
        allConditionsPassed = false
        logger.error(`[❌] [1] Сигнал не противоположен направлению тренда 1d, условие не выполнено ${value}:${trSignal1d.trValue}`)
    }


    /* Сигнал совпадает с направлением локального тренда */
    const trend = await getTrendForTf(pair, timeframe)

    if ((value === 'BUY' && trend === 'UP') ||
        (value === 'SELL' && trend === 'DOWN')
    ) {
        logger.info(`[✔️] [2] Сигнал совпадает с направлением локального тренда, условие выполнено ${value}:${trend}`)
    } else {
        allConditionsPassed = false
        logger.error(`[❌] [2] Сигнал не совпадает с направлением локального тренда, условие не выполнено ${value}:${trend}`)
    }


    /* Текущая цена отличается от последней скользящей средней того же таймфрейма */
    const lastMovingAverage = await getSignalMA(pair, timeframe)
    const lastPrice = await getCurrentPrice(pair)

    const diffPercentage = (Math.abs(lastPrice.priceCurrent - lastMovingAverage.maValue) / lastPrice.priceCurrent) * 100

    if (diffPercentage >= 3) {
        allConditionsPassed = false
        logger.error(`[❌] [3] Текущая цена отличается от последней скользящей средней больше чем на 3%, условие не выполнено ${lastMovingAverage.maValue}:${diffPercentage}`)
    } else {
        logger.info(`[✔️] [3] Текущая цена отличается от последней скользящей средней не больше чем на 3%, условие выполнено ${lastMovingAverage.maValue}:${diffPercentage}`)
    }

    /* const lastMovingAverage = await getSignalMA(pair, timeframe)
    const lastPrice = 1000

    const diffPercentage = (Math.abs(lastPrice.priceCurrent - lastMovingAverage.maValue) / lastPrice.priceCurrent) * 100

    if (diffPercentage >= 3) {
        allConditionsPassed = false
        logger.error(`[❌] [3] Текущая цена отличается от последней скользящей средней больше чем на 3%, условие не выполнено ${lastMovingAverage.maValue}:${diffPercentage}`)
    } else {
        logger.info(`[✔️] [3] Текущая цена отличается от последней скользящей средней не больше чем на 3%, условие выполнено ${lastMovingAverage.maValue}:${diffPercentage}`)
    } */


    /* Индикатор не перегрет (За последние 20 свечей получено макс. 3 сигнала) */
    await db.openDb()

    const sqlQuery = `
        SELECT pair, timeframe, value FROM si_signals WHERE pair = ? AND timeframe = ?
    `
    const params = [pair, timeframe]
    const siSignalArray = await db.getAll(sqlQuery, params)

    if (!siSignalArray || siSignalArray.length === 0) {
        return
    }

    await db.closeDb()

    const filtered = siSignalArray.filter(s => s.pair === pair && s.timeframe === timeframe)
    filtered.sort((a, b) => new Date(b.datetime) - new Date(a.datetime))

    const last20 = filtered.slice(0, 20)

    let buy = 0
    let sell = 0

    for (let lastsignal of last20) {
        if (lastsignal.value === 'BUY') {
            buy++
        } else if (lastsignal.value === 'SELL') {
            sell++
        }
    }

    if (buy >= 3 || sell >= 3) {
        allConditionsPassed = false
        logger.error(`[❌] [4] Индикатор перегрет, условие не выполнено [BUY сигналов:${buy}|SELL сигналов:${sell}]`)
    } else {
        logger.info(`[✔️] [4] Индикатор не перегрет, условие выполнено [BUY сигналов:${buy}|SELL сигналов:${sell}]`)
    }
    

    /* Еще нет открытых позиций по данной торговой паре */
    const openPositions = await getOpenPositions(pair, timeframe)

    if (openPositions.length > 1) {
        allConditionsPassed = false
        logger.error(`[❌] [5] Уже есть открытые позиции по данной торговой паре, условие не выполнено [${pair}:${openPositions.length}]`)
    } else {
        logger.info(`[✔️] [5] Еще нет открытых позиций по данной торговой паре, условие выполнено [${pair}:${openPositions.length}]`)
    }


    return allConditionsPassed
}


async function getTrendForTf(pair, timeframe) {
    const trSignal = await getSignalTR(pair, timeframe)
    if (!trSignal) {
        logger.error(`[❌] Не найдено сигнала на ${timeframe}:${pair} для TR`)
        return null
    }
    return trSignal.trValue >= 0 ? 'UP' : 'DOWN'
}


async function getOpenPositions(pair, timeframe) {
    await db.openDb()

    const sqlQuery = `
        SELECT value FROM si_signals WHERE pair = ? AND timeframe = ?
    `
    const params = [pair, timeframe]

    const siSignalArray = await db.getAll(sqlQuery, params)

    const filteredPair = siSignalArray.filter(s => s.pair === pair && s.timeframe === timeframe)

    await db.closeDb()

    return filteredPair
}


async function getCurrentPrice(pair) {
    const prices = await binance.futuresPrices()
    const ticker = prices[pair]
    if (!ticker) {
        logger.error(`[❌] Ошибка получения цены для торговой пары ${pair}`)
        return null
    }
    return {
        priceCurrent: ticker
    }
}


module.exports = {
    checkConditions,
    getCurrentPrice
}