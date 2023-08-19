const axios = require('axios')
require('dotenv').config()

const URL = process.env.SERVER_HOST

const data = {
    exchange: 'BINANCE',
    pair: 'BTCUSDT',
    timeframe: '3h',
    indicator: 'TR',
    value: '-0.0336038195263384'
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