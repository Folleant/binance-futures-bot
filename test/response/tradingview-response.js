const axios = require('axios')

//const url = 'http://localhost:3000/v3/view';
const url = 'https://radically-easy-hookworm.ngrok-free.app/v3/view'

const data = {
    exchange: 'BINANCE',
    pair: 'LTCUSDT',
    timeframe: '1h',
    indicator: 'SI',
    value: 'BUY'
};

async function run() {
    try {
        const response = await axios.post(url, data);
        console.log(response.data);
    } catch (err) {
        console.error(err);
    }
}

run();