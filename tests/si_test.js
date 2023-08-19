require('dotenv').config()

const axios = require('axios')

const URL = process.env.SERVER_HOST


const data = 'BINANCE BTCUSDT 3h SI BUY'

async function run() {
    try {
        const response = await axios.post(URL, data);
        console.log(response.data);
    } catch (err) {
        console.error(err);
    }
}


run();
