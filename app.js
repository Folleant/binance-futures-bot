/**
 * Trading bot [BINANCE FUTURES]
 * Creator: @folleant
 * Url Creator: https://kwork.ru/user/folleant
 * 
 * Date: 06.07.2023
 */

const express = require('express')
const logger = require('./utils/logger')
const appRoute = require('./routes/mainRoute')

require('dotenv').config()

const app = express()
app.use(express.json())
app.use('/v3', appRoute)


// MAIN URL
app.get('/', () => {
    console.log('Open main route!')
})


// OUTPUT
app.listen(process.env.SERVER_PORT, () => {
    try {
        console.log(`Starting server... ${process.env.SERVER_HOST}`)
        logger.info('✔️ Бот, ожидает запрос...')
    } catch (err) {
        logger.error(`❌ Ошибка, при запуске...\n${err.message}`)
    }
})
