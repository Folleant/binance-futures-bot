
require('dotenv').config()

const axios = require('axios')

const URL = process.env.SERVER_HOST


const data = 'BINANCE BTCUSDT 1d TR -0.0336038195263384'

async function run() {
    try {
        const response = await axios.post(URL, data);
        console.log(response.data);
    } catch (err) {
        console.error(err);
    }
}


run();
