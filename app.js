const express = require('express')
const path = require('path')

const logger = require('./modules/logging/logger')

const appRoutes = require('./routes/mainRoutes')

const { SERVER_PORT, SERVER_HOST } = require('./configuration/config')

const app = express()

app.use(express.json())
app.use('/v3', appRoutes)

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './templates/index.html'));
    logger.info(`✔️ Стартовая страница была открыта!.`);
})


app.listen(SERVER_PORT, () => {
    try {
        console.log(`Trading Bot is running at [${SERVER_HOST}]`)
        logger.info(`✔️ Торговый бот успешно запущен! Адрес: [${SERVER_HOST}]`)
    } catch (err) {
        logger.error(`❌ Ошибка при запуске торгового бота! Ошибка: ${err.message}`)
    }
})