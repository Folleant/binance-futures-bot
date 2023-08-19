require('dotenv').config()

const db = require('../functions/db')
const logger = require('../utils/logger')
const { checkConditions, getCurrentPrice } = require('../functions/checkConditions')
const { calculatePositionSize, setLeverage, setStopLoss, setTakeProfit, openLongPosition, openShortPosition, closePosition, checkingReverseSignal} = require('../functions/handlePosition')


async function processingRequest(exchange, pair, timeframe, indicator, value) {
    if (!exchange, !pair, !timeframe, !indicator, !value) {
        logger.error('[❌] Ошибка обработки запроса на валидность условий')
    } else {
        logger.info('[✔️] Начинаем обработку запроса на валидность условий торговли...')
    }
    
    try {
        await db.openDb()

        const allConditionsPassed = await checkConditions(pair, timeframe, value)

        if (allConditionsPassed) {
            logger.info('[✔️] Все условия валидны, успешно')

            const bankSize = process.env.bank_size
            const entryPrice = await getCurrentPrice(pair)
            const pricePosition = entryPrice.priceCurrent
            const leverage = await setLeverage(timeframe)
            const leverageCurrent = leverage.LEVER
            const positionSize = await calculatePositionSize(bankSize)
            const direction = value === 'BUY' ? 'LONG' : 'SHORT'
            const StopLoss = await setStopLoss(positionSize, leverageCurrent, value, direction)
            const TakeProfit = await setTakeProfit(positionSize, leverageCurrent, value, direction)
            const statusOpen = 'Открыта'
            const statusClosed = 'Закрыта'

            logger.info('[✔️] Проверка значений для открытия позиции:')
            logger.info(`[✔️] Цена пары: ${pricePosition} | Размер плеча: ${leverageCurrent} | Цена входа: ${positionSize} | Направление: ${direction} | Цена стоп-лосса: ${StopLoss} | Цена тейк-профита: ${TakeProfit}`)
            

            if (indicator === 'SI' && value === 'BUY') {
                logger.info('[✔️] Все значения установлены, открываем позицию')
                await openLongPosition(pair, direction, positionSize, pricePosition, leverageCurrent, StopLoss, TakeProfit)
                await db.savePositions(exchange, pair, direction, timeframe, positionSize, StopLoss, TakeProfit, leverageCurrent, statusOpen)
            } else if (indicator === 'SI' && value === 'SELL') {
                logger.info('[✔️] Проверка уже открытых позиций LONG:')
                const openCheck = await checkingReverseSignal(pair, timeframe, 'LONG')

                if (openCheck.amountSignal > 0) {
                    await db.closePositions(exchange, pair, 'LONG', timeframe, positionSize, pricePosition, leverageCurrent, 'Reverse Signal')
                    await db.updatePositions(pair, 'LONG', timeframe, statusClosed)
                    await closePosition(pair, positionSize)
                } else {
                    logger.info('[✔️] Все значения установлены, открываем позицию')
                    await openShortPosition(pair, direction, positionSize, pricePosition, leverageCurrent, StopLoss, TakeProfit)
                    await db.savePositions(exchange, pair, direction, timeframe, positionSize, StopLoss, TakeProfit, leverageCurrent, statusOpen)
                }
                
            } else {
                logger.error('[❌] Ошибка при открытие позиции...')
            }
        } else {
            logger.error(`[❌] Одно из условий не было валидно, позиция не будет открыта`)
        }

        await db.closeDb()
        
    } catch (err) {
        logger.error(`[❌] Error occurred while processing the request: ${err}`)
    } 

}


module.exports = { processingRequest }