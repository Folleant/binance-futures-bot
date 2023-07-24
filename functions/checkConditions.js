const logger = require('../utils/logger')
const binance = require('../utils/binance')


async function getTrendDirection (pair) {
    // get oglc data for each timeframe
    const data = await binance.futuresChart(pair, '1d')
    let direction

    if (data[0] < data[data.length - 1]) {
        direction = 'UP'
    } else {
        direction = 'DOWN'
    }
    return {
        direction: direction
    }
}

async function getLocalTrend(pair) {
    const intervals = ['1h', '2h', '4h', '6h', '12h']
    const trends = {}
    let trend

    for (const timeframe of intervals) {
        const candles = await binance.futuresCandles(pair, timeframe)

        const closePrices = candles.map(c => c.close)

        if (closePrices[0] < closePrices[closePrices.length -1]) {
            trend = 'UP'
        } else {
            trend = 'DOWN'
        }

        trends[timeframe] = trend
    }

    return {
        direction: trends,
        directionTrend: trend
    }
}

async function getcheckLocalTrends(pair, signal) {
    const trends = await getLocalTrend(pair)

    const results = Object.values(trends).map(trend => {
        return trend === signal
    })

    const isMatch = results.every(res => res)

    //logger.info(`Локальный тренд: ${JSON.stringify(trends.direction)}`)
    logger.info(`Локальный тренд: [${trends.directionTrend}]`)
    
    return {
        isMatch: isMatch
    }
}

async function getMovingAverage(pair, timeframe, period) {
    const candles = await binance.futuresCandles(pair, timeframe)
    const closes = candles.map(c => c.close)
    const sma = closes.slice(-period).reduce((acc, price) => acc + price, 0) / period

    const prices = await getCurrentPrice(pair)
    logger.info(`Цена торговой пары: ${prices.priceCurrent} [${pair}]`)
    
    return {
        sma: sma
    }
}

async function getRecentSignals(pair, timeframe, maxSignals, ticks) {
    const recentTicks = await binance.futuresCandles(pair, timeframe, ticks)
    const ticksArray = Object.values(recentTicks)
    const recentSignal = ticksArray.filter((tick) => tick.isBuyerMaker && tick.isBestMatch)
    const signalCount = recentSignal.reduce((count, signal) => {
        if (signal.isBuyerMaker && signal.isBestMatch) {
            count++
        }
        return count
    }, 0)

    const isOverheated = signalCount >= maxSignals

    return {
        total: isOverheated,
        countTotal: signalCount
    }
}

async function getCurrentPrice(pair) {
    const prices = await binance.futuresPrices()
    const ticker = prices[pair]
    if (!ticker) {
        throw new Error(`Pair ${pair} not found in prices`)
    }
    return {
        priceCurrent: ticker
    }
}

module.exports = {
    getTrendDirection,
    getLocalTrend,
    getcheckLocalTrends,
    getMovingAverage,
    getRecentSignals,
    getCurrentPrice
}