const express = require('express')
const Binance = require('node-binance-api')
const { checkConditions, getCurrentPrice } = require('../functions/checkConditions')

const app = express()
const binance = new Binance().options({
    APIKEY: '67b92f926c02403cbebffab227c200d2f90bd4f4d6bb2d253e1755fc7e727643',
    APISECRET: '520901e93ad133e0092760af09c45864c71274e0dd1e0da7f0ad43a6247537e7',
    test: true
})

app.get('/1', async (req, res) => {
    const pair = 'BTCUSDT'
    console.log(`1: Пара ${pair}`)

    const entryPrice = await getCurrentPrice(pair)
    const pricePosition = parseFloat(entryPrice.priceCurrent)
    console.log(`Сумма пары: ${pricePosition}`)

    const amount = 10
    console.log(`Сумма банка`)
    console.log(amount)

    const quantity = amount / pricePosition
    console.log(`Сумма открытия quantity: ${quantity}`)

    const leverage = 10

    const stopLoss = 25000

    const takeProfit = 28000

    const level = await binance.futuresLeverage(pair, leverage)
    console.log(`Установка плеча...`)
    console.log(level)

    const positionResponse = await binance.futuresMarketBuy(pair, quantity)
    const positionId = positionResponse.clientOrderId
    console.log('Открытие позиции...')
    console.log(positionResponse)

    const sell = await binance.futuresMarketSell(pair, quantity, {
        type: "STOP_MARKET",
        stopPrice: stopLoss,
        newClientOrderId: positionId + '-SL',
        closePosition: true
    })
    console.log('Установка Стоп-лосс...')
    console.log(sell)

    const take = await binance.futuresMarketSell(pair, quantity, {
        type: "TAKE_PROFIT_MARKET",
        stopPrice: takeProfit,
        newClientOrderId: positionId + '-TP',
        closePosition: true
    })
    console.log('Установка Тейк-профита...')
    console.log(take)

    const stopLossOrderId = sell.clientOrderId
    const takeProfitOrderId = take.clientOrderId
    await binance.futuresCancel(pair, stopLossOrderId)
    await binance.futuresCancel(pair, takeProfitOrderId)

    console.log('[✔️] LONG позиция была успешно открыта!')
    console.log(`ID Позиции: `, positionId)/*  */
})


app.listen(3000, () => {
    console.log('Running on port 3000')
})