const Binance = require('node-binance-api')
require('dotenv').config()


const binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.API_SECRET,
    test: true,
    //recvWindow: 60000,
    //useServerTime: true,
    // verbose: true,
})

module.exports = binance