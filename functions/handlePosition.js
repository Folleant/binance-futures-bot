const db = require('../functions/db')
const logger = require('../utils/logger')
const binance = require('../utils/binance')
const createRetryFunction = require('../utils/createRetryFunction')

require('dotenv').config()



async function calculatePositionSize(bankSize) {
    try {
        const positionSize = bankSize / 10
        return positionSize
    } catch (err) {
        logger.error(`calculatePositionSize: ${err}`)
        return null
    }
}


async function setLeverage(timeframe) {
    try {
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
    } catch (err) {
        logger.error(`setLeverage: ${err}`)
        return null
    }
}


async function setStopLoss(price, leverage, value, direction) {
    try {
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
    } catch (err) {
        logger.error(`setStopLoss: ${err}`)
        return null
    }
}

async function setTakeProfit(price, leverage, value, direction) {
    try {
        const priceDiff = 0.1 * price / leverage
        let takeProfitPrice

        if (value === 'BUY' && direction === 'LONG') {
            takeProfitPrice = price + priceDiff
        } else if (value === 'SELL' && direction === 'SHORT') {
            takeProfitPrice = price - priceDiff
        } else {
            logger.error('[❌] TAKE-PROFIT: Неизвестное значение, ошибка')
            return { takeProfitPrice: null }
        }

        return takeProfitPrice
    } catch (err) {
        logger.error(`setTakeProfit: ${err}`)
        return null
    }
}

const errorMessages = {
    '-1111': 'Точность превышает максимальное значение, определенное для данного актива.',
    '-4007': 'Стоп-цена больше максимальной цены.',
    '-1102': 'Обязательный параметр timestamp не был отправлен, был пустым/нулевым или неправильно сформирован.',
    '-2015': 'Неверный API-ключ, IP или разрешения для действия',
    '-4006': 'Стоп-цена меньше нуля.',
    '-4015': 'Идентификатор заказа клиента не действителен.',
    '-2021': 'Приказ немедленно срабатывает.',
}

function getErrorMessage(code) {
    return errorMessages[code] || 'Неизвестная ошибка'
}

async function openLongPosition(pair, direction, positionSize, pricePosition, leverageCurrent, stopLossPrice, takeProfitPrice) {
    try {
        const symbol = pair // торговая пара
        const side = direction // направление
        const amount = positionSize // цена входа
        const symbolPrice = pricePosition // цена пары
        const getLeverage = leverageCurrent // плечо
        const stopLoss = stopLossPrice.toFixed(3)
        const takeProfit = takeProfitPrice  // тейк-профит
        const quantity = amount

        logger.info(`
            [SYMBOL]: ${symbol},
            [SIDE]: ${side},
            [AMOUNT]: ${amount},
            [SYMBOLPRICE]: ${symbolPrice},
            [LEVERAGE]: ${getLeverage},
            [STOPLOSS]: ${stopLoss},
            [TAKEPROFIT]: ${takeProfit},
            [QUANTITY]: ${quantity}
        `)

        const setLeverage = async () => {
            return binance.futuresLeverage(symbol, getLeverage)
        }

        const openPosition = async () => {
            return binance.futuresMarketBuy(symbol, quantity)
        }

        const openStopLoss = async () => {
            return binance.futuresMarketSell(symbol, quantity, {
                type: "STOP_MARKET",
                stopPrice: stopLoss,
                newClientOrderId: positionId + '-SL',
                closePosition: true
            })
        }

        const openTakeProfit = async () => {
            return binance.futuresMarketSell(symbol, quantity, {
                type: "TAKE_PROFIT_MARKET",
                stopPrice: takeProfit,
                newClientOrderId: positionId + '-TP',
                closePosition: true
            })
        }

        await createRetryFunction(setLeverage, process.env.MAX_RETRIES, process.env.RETRY_DELAY)
        logger.info('Установка плеча...')

        const positionResponse = await createRetryFunction(openPosition, process.env.MAX_RETRIES, process.env.RETRY_DELAY)
        const positionId = positionResponse.clientOrderId
        if (positionResponse && positionResponse.code) {
            const errorMessage = getErrorMessage(positionResponse.code);
            logger.error(`[❌] Ошибка при открытии позиции LONG: ${errorMessage}`)
        }
        logger.info(`Открытие позиции...:`)
        console.log(positionResponse)

        const sell = await createRetryFunction(openStopLoss, process.env.MAX_RETRIES, process.env.RETRY_DELAY)
        if (sell && sell.code) {
            const errorMessage = getErrorMessage(sell.code);
            logger.error(`[❌] Ошибка при установке Стоп-лосса: ${errorMessage}`)
        }
        logger.info(`Установка Стоп-лосс...`)
        console.log(sell)

        const take = await createRetryFunction(openTakeProfit, process.env.MAX_RETRIES, process.env.RETRY_DELAY)
        if (take && take.code) {
            const errorMessage = getErrorMessage(take.code);
            logger.error(`[❌] Ошибка при установке Тейк-профита: ${errorMessage}`)
            return null
        }
        logger.info(`Установка Тейк-профита...`)
        console.log(take)

        const stopLossOrderId = sell.clientOrderId
        const takeProfitOrderId = take.clientOrderId

        const stopCancel = async () => {
            return binance.futuresCancel(symbol, stopLossOrderId)
        }
        await createRetryFunction(stopCancel, process.env.MAX_RETRIES, process.env.RETRY_DELAY)

        const takeCancel = async () => {
            return binance.futuresCancel(symbol, takeProfitOrderId)
        }
        await createRetryFunction(takeCancel, process.env.MAX_RETRIES, process.env.RETRY_DELAY)

        logger.info('[✔️] LONG позиция была успешно открыта!')
        console.log(`ID POSITION: `, positionId)

        return positionResponse
    } catch (err) {
        logger.error(`[❌] Ошибка при открытие позиции LONG: ${err.stack}`)
        return null
    }
}


async function openShortPosition(pair, direction, positionSize, pricePosition, leverageCurrent, stopLossPrice, takeProfitPrice) {
    try {
        const symbol = pair // торговая пара
        const side = direction // направление
        const amount = positionSize // цена входа
        const symbolPrice = pricePosition // цена пары
        const getLeverage = leverageCurrent // плечо
        const stopLoss = stopLossPrice
        const takeProfit = takeProfitPrice  // тейк-профит
        const quantity = amount

        logger.info(`
            [SYMBOL]: ${symbol},
            [SIDE]: ${side},
            [AMOUNT]: ${amount},
            [SYMBOLPRICE]: ${symbolPrice},
            [LEVERAGE]: ${getLeverage},
            [STOPLOSS]: ${stopLoss},
            [TAKEPROFIT]: ${takeProfit},
            [QUANTITY]: ${quantity}
        `)

        const setLeverage = async () => {
            return binance.futuresLeverage(symbol, getLeverage)
        }

        const openPosition = async () => {
            return binance.futuresMarketSell(symbol, quantity)
        }

        const openStopLoss = async () => {
            return binance.futuresMarketBuy(symbol, quantity, {
                type: "STOP_MARKET",
                stopPrice: stopLoss,
                newClientOrderId: positionId + '-SL',
                closePosition: true
            })
        }

        const openTakeProfit = async () => {
            return binance.futuresMarketBuy(symbol, quantity, {
                type: "TAKE_PROFIT_MARKET",
                stopPrice: takeProfit,
                newClientOrderId: positionId + '-TP',
                closePosition: true
            })
        }

        await createRetryFunction(setLeverage, process.env.MAX_RETRIES, process.env.RETRY_DELAY)
        logger.info('Установка плеча...')

        const positionResponse = await createRetryFunction(openPosition, process.env.MAX_RETRIES, process.env.RETRY_DELAY)
        const positionId = positionResponse.clientOrderId
        if (positionResponse && positionResponse.code) {
            const errorMessage = getErrorMessage(positionResponse.code);
            logger.error(`[❌] Ошибка при открытии позиции LONG: ${errorMessage}`)
        }
        logger.info(`Открытие позиции...:`)
        console.log(positionResponse)

        const sell = await createRetryFunction(openStopLoss, process.env.MAX_RETRIES, process.env.RETRY_DELAY)
        if (sell && sell.code) {
            const errorMessage = getErrorMessage(sell.code);
            logger.error(`[❌] Ошибка при установке Стоп-лосса: ${errorMessage}`)
        }
        logger.info(`Установка Стоп-лосс...`)
        console.log(sell)

        const take = await createRetryFunction(openTakeProfit, process.env.MAX_RETRIES, process.env.RETRY_DELAY)
        if (take && take.code) {
            const errorMessage = getErrorMessage(take.code);
            logger.error(`[❌] Ошибка при установке Тейк-профита: ${errorMessage}`)
            return null
        }
        logger.info(`Установка Тейк-профита...`)
        console.log(take)

        const stopLossOrderId = sell.clientOrderId
        const takeProfitOrderId = take.clientOrderId

        const stopCancel = async () => {
            return binance.futuresCancel(symbol, stopLossOrderId)
        }
        await createRetryFunction(stopCancel, process.env.MAX_RETRIES, process.env.RETRY_DELAY)

        const takeCancel = async () => {
            return binance.futuresCancel(symbol, takeProfitOrderId)
        }
        await createRetryFunction(takeCancel, process.env.MAX_RETRIES, process.env.RETRY_DELAY)

        logger.info('[✔️] SHORT позиция была успешно открыта!')
        console.log(`ID POSITION: `, positionId)

        return positionResponse
    } catch (err) {
        logger.error(`[❌] Ошибка при открытие позиции LONG: ${err.stack}`)
        return null
    }
}


async function closePosition(pair, positionSize) {
    try {
        const symbol = pair
        const amount = positionSize

        const futuresCancelOrder = async () => {
            return binance.futuresCancelAll(symbol)
        }
        await createRetryFunction(futuresCancelOrder, process.env.MAX_RETRIES, process.env.RETRY_DELAY)
        logger.info('Закрытие всех ордеров!')

        const futuresMarketSell = async () => {
            return binance.futuresMarketSell(symbol, amount)
        }
        const orderResult = await createRetryFunction(futuresMarketSell, process.env.MAX_RETRIES, process.env.RETRY_DELAY)
        logger.info('Закрытие позиции!')

        return orderResult
    } catch (err) {
        logger.error(`[❌] Ошибка при открытие позиции: ${err}`)
        return null
    }
}


async function checkingReverseSignal(pair, timeframe, direction) {
    try {
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
    } catch (err) {
        logger.error(`checkingReverse: ${err}`)
        return null
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