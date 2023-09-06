const Binance = require('node-binance-api')
require('dotenv').config()
const moment = require('moment')

const timestamp = moment().valueOf()

const binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.API_SECRET,
    //recvWindow: 60000,
    timestamp
    //useServerTime: true,
    // verbose: true,
})

module.exports = binance