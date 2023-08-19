/**
 * Trading bot [BINANCE FUTURES]
 * Creator: @folleant
 * Url Creator: https://kwork.ru/user/folleant
 * 
 * Date: 06.07.2023
 */


const express = require('express')
const request = require('request')
const bodyParser = require('body-parser');
const logger = require('./utils/logger')
const appRoute = require('./routes/mainRoute')

require('dotenv').config()
require('http').globalAgent.maxSockets = 40

const app = express()
app.use(express.json())
app.use(bodyParser.text())
app.use('/v3', appRoute)

// MAIN URL
app.get('/', (req, res) => {
    console.log('Главный маршрут!')
    res.send('Главный маршрут работает!')
})


const server = app.listen(process.env.SERVER_PORT, () => {
    try {
        console.log(`Starting server... ${process.env.SERVER_HOST}`)
        logger.info('[✔️] Торговый бот запущен! Ожидаем запрос...')

        setInterval(() => {
            request.get(`${process.env.SERVER_PING}`)
            console.log(`Отправлен ping запрос на ${process.env.SERVER_PING}`)
        }, 30000)
    } catch (err) {
        logger.error(`[❌] Ошибка, при запуске торгового бота... \n${err.message}`)
    }
})


app.use((req, res, next) => {
    res.setTimeout(60000 , () => {
        logger.error('[❌] Превышено время ожидания запроса')
        res.status(504).send('Timeout exceeded')
    })
    next()
})


app.use((err, req, res, next) => {
    logger.error(`[❌] Произошла ошибка: ${err.message}`)
    res.status(500).send(`[❌] Произошла ошибка: ${err.message}`)
})


process.on('SIGTERM', () => {
    server.close(() => {
        logger.info('Сервер остановлен')
        process.exit(0)
    })  
})

