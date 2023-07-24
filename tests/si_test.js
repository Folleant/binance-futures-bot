const axios = require('axios')
require('dotenv').config()

const URL = process.env.SERVER_HOST

const data = {
    exchange: 'BINANCE',
    pair: 'LTCUSDT',
    timeframe: '1h',
    indicator: 'SI',
    value: 'BUY'
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