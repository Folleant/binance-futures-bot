const logger = require('../utils/logger')
const binance = require('../utils/binance')

const { getTrendDirection, getLocalTrend, getcheckLocalTrends, getMovingAverage, getRecentSignals, getCurrentPrice } = require('../functions/checkConditions')
const { openLongPosition, openShortPosition } = require('../functions/handlePosition')
const { getSignalTR, getSignalMA } = require('../functions/getSignals')

async function processingRequest(exchange, pair, timeframe, indicator, value) {

    // let quantity = 10

    try {

        if (!exchange, !pair, !timeframe, !indicator, !value) {
            logger.error('❌ Error starting request processing')
        } else {
            logger.info('✔️ Processing a request to start')
        }

        // Flag accepted all if
        let allConditionsPassed = true

        // Getting signal data from json files
        const getTR = await getSignalTR(pair, timeframe)
        const getMA = await getSignalMA(pair, timeframe)
        logger.info(`Testing getTR: ${getTR.trValue} ${getMA.maValue}`)


        // Checking conditions
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
        logger.error('Error processing a condition request', err)
    }

}


module.exports = { processingRequest }