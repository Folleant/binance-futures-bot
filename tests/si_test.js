require('dotenv').config()

const axios = require('axios')

const URL = process.env.SERVER_HOST

const data = {
    exchange: 'BINANCE',
    pair: 'LTCUSDT',
    timeframe: '1h',
    indicator: 'SI',
    value: 'BUY'
}

const data2 = {
    exchange: 'BINANCE',
    pair: 'LTCUSDT',
    timeframe: '1h',
    indicator: 'SI',
    value: 'SELL'
}

async function run() {
    try {
        const response = await axios.post(URL, data);
        console.log(response.data);
    } catch (err) {
        console.error(err);
    }
}


run();
