const binance = require('../modules/binanceAPI/binance')
const logger = require('../modules/logging/logger')


async function processingHandleRequest(pair, timeframe, indicator, value, quantity) {
    try {
        // Flag accepted all if
        let allConditionsPassed = true

        logger.info(`✔️ Получены данные с запроса в функцию: [${pair}] [${timeframe}] [${indicator}] [${value}] [${quantity}]`)

        // Проверка условий
        const checkTrend = async () => {
            const trend = await getTrendDirection(pair)
            logger.info(`Направление тренда: [${trend.direction}]`)
            return indicator !== trend.direction
        }
        const checkSignalOverheat = async () => {
            const recentSignal = await getRecentSignals(pair, timeframe, 3, 20)
            const buySellSignals = recentSignal.countTotal
            logger.info(`Количество сигналов в периоде 20 тиков: [${buySellSignals}]`)
            return buySellSignals < 3
        }

        // get trend direction
        logger.info('✔️ Получение направления тренда...')
        if (await checkTrend()) {
            logger.info('✔️ Сигнал противоположен направлению тренда [Условие выполнено!]')
        } else {
            allConditionsPassed = false
            logger.warn('❌ Сигнал не противоположен направлению тренда [Условие не выполнено!]')
        }

        // get local trend
        logger.info('✔️ Получение локального тренда...')
        if (await getcheckLocalTrends(pair, value)) {
            logger.info('✔️ Сигнал соответствует локальному тренду [Условие выполнено!]')
        } else {
            allConditionsPassed = false
            logger.warn('❌ Сигнал не соответствует локальному тренду [Условие не выполнено!]')
        }

        // get last moving average price
        logger.info('✔️ Получение скользящей средней...')
        if (await getMovingAverage(pair, timeframe, 20)) {
            logger.info('✔️ Текущая цена находится в пределах 3% от MA [Условие выполнено!]')
        } else {
            allConditionsPassed = false
            logger.warn('❌ Текущая цена выше предела 3% от MA [Условие не выполнено!]')
        }

        // get recent signals
        logger.info('✔️ Получение 20 последних сигналов...')
        if (await checkSignalOverheat()) {
            logger.info('✔️ Индикатор не перегрет! [Условие выполнено!]')
        } else {
            allConditionsPassed = false
            logger.warn('❌ Индикатор перегрелся! Кол-во сигналов выше [Условие не выполнено!]')
        }

        if (allConditionsPassed) {
            logger.info('✔️ Все условия выполнены, приступаем к открытию позиций')

            if (indicator === 'SI' && value === 'BUY') {
                // Long
                await openLongPosition(pair, quantity)
                logger.info(`✔️ LONG Позиция открыта! ${pair}`)
            } else if (indicator === 'SI' && value === 'SELL') {
                // Short
                await openShortPosition(pair, quantity)
                logger.info(`✔️ SHORT Позиция открыта! ${pair}`)
            } else {
                // Error
                logger.error('❌ Ошибка при открытие позиции!')
            }
        } else {
            logger.warn('❌ Одно из условий не выполнено! Позиция открыта не будет!')
        }

    } catch (err) {
        logger.error(`Error handling request: ${err.message}`)
    }
}


async function getTrendDirection(pair) {
    // get oglc data for each timeframe
    const data = await binance.futuresChart(pair, "1d")

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




async function openLongPosition(pair, quantity) {
    await binance.futuresMarketBuy(pair, quantity)
    logger.info(`Opened long position for ${pair} with quantity ${quantity}`)
}

async function openShortPosition(pair, quantity) {
    await binance.futuresMarketSell(pair, quantity)
    logger.info(`Opened short position for ${pair} with quantity ${quantity}`)
}


module.exports = { processingHandleRequest }



