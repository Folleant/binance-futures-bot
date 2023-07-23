const Binance = require('node-binance-api')
const config = require('../../configuration/config')


const binance = new Binance().options({
    APIKEY: config.API_KEY,
    APISECRET: config.API_SECRET,
    test: true,
    recvWindow: 60000,
    //verbose: true,
    log: log => {
        console.log(log);
    }
})

module.exports = binance