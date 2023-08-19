const db = require('../functions/db')
const logger = require('../utils/logger')
const binance = require('../utils/binance')

require('dotenv').config()



async function calculatePositionSize(bankSize) {
    const positionSize = bankSize / 10

    return positionSize
}


async function setLeverage(timeframe) {
    let leverage = 1

    switch (timeframe) {
        case '4h':
            leverage = 5
            break
        case '3h':
            leverage = 7
            break
        case '2h':
            leverage = 9
            break
        case '1h':
            leverage = 10
            break
        default:
            leverage = 1
            break
    }

    return {
        LEVER: leverage
    }
}


async function setStopLoss(price, leverage, value, direction) {
    const priceDiff = 0.2 * price / leverage
    let stopLossPrice

    if (value === 'BUY' && direction === 'LONG') {
        stopLossPrice = price - priceDiff
    } else if (value === 'SELL' && direction === 'SHORT') {
        stopLossPrice = price + priceDiff
    } else {
        logger.error('[❌] STOP-LOSS: Неизвестное значение, ошибка')
        return { stopLossPrice: null }
    }

    return stopLossPrice
}


async function setTakeProfit(price, leverage, direction) {
    const priceDiff = 0.1 * price / leverage
    let takeProfitPrice

    if (direction === 'BUY') {
        takeProfitPrice = price + priceDiff
    } else if (direction === 'SELL') {
        takeProfitPrice = price - priceDiff
    } else {
        logger.error('[❌] TAKE-PROFIT: Неизвестное значение, ошибка')
        return { takeProfitPrice: null }
    }

    return takeProfitPrice
}


async function openLongPosition(pair, direction, positionSize, pricePosition, leverageCurrent, stopLossPrice, takeProfitPrice) {
    try {
        const symbol = pair // торговая пара
        const side = direction // направление
        const amount = positionSize // цена входа
        const symbolPrice = pricePosition // цена пары
        const getLeverage = leverageCurrent // плечо
        const stopLoss = stopLossPrice // стоп-лосс
        const takeProfit = takeProfitPrice // тейк-профит

        await binance.futuresLeverage(symbol, getLeverage)
        logger.info('Установка плеча...')

        const positionResponse = await binance.futuresMarketBuy(symbol, amount)
        const positionId = positionResponse.clientOrderId
        logger.info('Открытие позиции...')

        const sell = await binance.futuresMarketSell(symbol, amount, {
            type: "STOP_MARKET",
            stopPrice: stopLoss,
            newClientOrderId: positionId + '-SL',
            closePosition: true
        })
        logger.info('Установка Стоп-лосс...')

        const take = await binance.futuresMarketSell(symbol, amount, {
            type: "TAKE_PROFIT_MARKET",
            stopPrice: takeProfit,
            newClientOrderId: positionId + '-TP',
            closePosition: true
        })
        logger.info('Установка Тейк-профита...')

        const stopLossOrderId = sell.clientOrderId
        const takeProfitOrderId = take.clientOrderId
        await binance.futuresCancel(symbol, stopLossOrderId)
        await binance.futuresCancel(symbol, takeProfitOrderId)

        logger.info('[✔️] LONG позиция была успешно открыта!')
        logger.info(`ID Позиции: ${positionId}`)

        return positionResponse
    } catch (err) {
        logger.error(`[❌] Ошибка при открытие позиции LONG: ${err}`)
    }
}


async function openShortPosition(pair, direction, positionSize, pricePosition, leverageCurrent, stopLossPrice, takeProfitPrice) {
    try {
        const symbol = pair // торговая пара
        const side = direction // направление
        const amount = positionSize // цена входа
        const symbolPrice = pricePosition // цена пары
        const getLeverage = leverageCurrent // плечо
        const stopLoss = stopLossPrice // стоп-лосс
        const takeProfit = takeProfitPrice // тейк-профит

        await binance.futuresLeverage(symbol, getLeverage)
        logger.info('Установка плеча...')

        const positionResponse = await binance.futuresMarketSell(symbol, amount)
        const positionId = positionResponse.clientOrderId
        logger.info('Открытие позиции...')

        const sell = await binance.futuresMarketBuy(symbol, amount, {
            type: "STOP_MARKET",
            stopPrice: stopLoss,
            newClientOrderId: positionId + '-SL',
            closePosition: true
        })
        logger.info('Установка Стоп-лосс...')

        const take = await binance.futuresMarketBuy(symbol, amount, {
            type: "TAKE_PROFIT_MARKET",
            stopPrice: takeProfit,
            newClientOrderId: positionId + '-TP',
            closePosition: true
        })
        logger.info('Установка Тейк-профита...')

        const stopLossOrderId = sell.clientOrderId
        const takeProfitOrderId = take.clientOrderId
        await binance.futuresCancel(symbol, stopLossOrderId)
        await binance.futuresCancel(symbol, takeProfitOrderId)

        logger.info('[✔️] SHORT позиция была успешно открыта!')
        logger.info(`ID Позиции: ${positionId}`)

        return positionResponse
    } catch (err) {
        logger.error(`[❌] Ошибка при открытие позиции short: ${err}`)
    }
}


async function closePosition(pair, positionSize) {
    try {
        const symbol = pair
        const amount = positionSize

        await binance.futuresCancelAll(symbol)
        logger.info('Закрытие всех ордеров!')

        const orderResult = await binance.futuresMarketSell(symbol, amount)
        logger.info('Закрытие позиции!')

        return orderResult
    } catch (err) {
        logger.error(`[❌] Ошибка при открытие позиции: ${err}`)
    }
}


async function checkingReverseSignal(pair, timeframe, direction) {
    await db.openDb()

    const sqlQuery = `
        SELECT * FROM open_positions WHERE pair = ? AND timeframe = ? AND direction = ?
    `
    const params = [pair, timeframe, direction]
    const siSignalArray = await db.getAll(sqlQuery, params)

    const filtered = siSignalArray.filter(s => s.pair === pair && s.timeframe === timeframe && s.direction === 'LONG')
    logger.info(`[✔️] Открытых LONG позиций по данной торговой паре не найдено [${filtered.length}]`)
    
    await db.closeDb()

    return {
        amountSignal: filtered.length
    }
}


module.exports = {
    calculatePositionSize,
    setLeverage,
    setStopLoss,
    setTakeProfit,
    openLongPosition,
    openShortPosition,
    closePosition,
    checkingReverseSignal
}