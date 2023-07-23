const { createLogger, format, transports } = require('winston')
const path = require('path')

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({
            format: 'DD-MM-YYYY HH:mm'
        }),
        format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
    ),
    transports: [
        new transports.File({
            filename: path.join(__dirname, '../../utils/logs/errors.log'),
            level: 'error',
            format: format.json()
        }),
        new transports.File({
            filename: path.join(__dirname, '../../utils/logs/trades.log')
        }),
        new transports.Console({
            format: format.simple()
        })
    ]
})

module.exports = logger