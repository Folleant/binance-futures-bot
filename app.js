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
            try {
                request.get(`${process.env.SERVER_PING}/api/view`, (error, response, body) => {
                    if (error) {
                        if (error.code === 'ESOCKETTIMEDOUT') {
                            console.error('[❌] Произошла ошибка ESOCKETTIMEDOUT при отправке запроса.')
                        } else {
                            console.error(`[❌] Произошла ошибка при отправке запроса: ${error.message}`)
                        }
                    } else {
                        console.log(`Ответ на ping запрос: ${body}`)
                    }
                })
                console.log(`Отправлен ping запрос на ${process.env.SERVER_PING}/api/view`)
            } catch (err) {
                console.error(`[❌] Ошибка, при выполнении запроса... \n${err.message}`)
            }
        }, 3000000)
    } catch (err) {
        logger.error(`[❌] Ошибка, при запуске торгового бота... \n${err.message}`)
    }
})


app.use((req, res, next) => {
    res.setTimeout(600000 , () => {
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

