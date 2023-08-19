const express = require('express');
const Binance = require('node-binance-api');

const app = express();
const binance = new Binance().options({
    APIKEY: '67b92f926c02403cbebffab227c200d2f90bd4f4d6bb2d253e1755fc7e727643',
    APISECRET: '520901e93ad133e0092760af09c45864c71274e0dd1e0da7f0ad43a6247537e7',
    test: true
});


app.listen(3000, () => {
    console.log('Running on port 3000'); 
  });