const logger = require('../utils/logger')
const binance = require('../utils/binance')


async function openLongPosition(pair, quantity) {
    await binance.futuresMarketBuy(pair, quantity)
    logger.info(`Opened long position for ${pair} with quantity ${quantity}`)
}

async function openShortPosition(pair, quantity) {
    await binance.futuresMarketSell(pair, quantity)
    logger.info(`Opened short position for ${pair} with quantity ${quantity}`)
}


module.exports = {
    openLongPosition,
    openShortPosition
}