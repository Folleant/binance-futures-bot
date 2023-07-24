const axios = require('axios')
require('dotenv').config()

const URL = process.env.SERVER_HOST

const data = {
    exchange: 'BINANCE',
    pair: 'LTCUSDT',
    timeframe: '1h',
    indicator: 'MA',
    value: 0.8103999999999996
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