const sqlite3 = require('sqlite3')
const logger = require('../utils/logger')
const moment = require('moment')

const DB_PATH = './database/binFutures.db'
let db


module.exports = {
    openDb: async () => {
        try {
            db = new sqlite3.Database(DB_PATH)
        } catch (err) {
            logger.error(`Failed to connect database: ${err}`)
        }

        return db
    },

    closeDb: async () => {
        try {
            module.exports.openDb()
            db.close((err) => {
                if (err) {
                    logger.error('[❌] Ошибка при закрытии базы данных', err.message)
                } 
            })
        } catch (err) {
            logger.error(`Failed to connect database: ${err}`)
        }
    },

    saveSignals: async (exchange, pair, timeframe, indicator, value) => {
        try {
            await module.exports.openDb()
            let sql, params
            const datetime = new Date().toISOString()
            const dt = moment(datetime).format('YYYY-MM-DD HH:mm:ss')
    
            switch (indicator) {
                case 'SI':
                    sql = `
                    INSERT INTO si_signals (exchange, pair, timeframe, indicator, value, datetime)
                    VALUES (?, ?, ?, ?, ?, ?) 
                `
                    params = [exchange, pair, timeframe, indicator, value, dt]
                    break
                case 'TR':
                    sql = `
                        INSERT INTO tr_signals (exchange, pair, timeframe, indicator, value, datetime)
                        VALUES (?, ?, ?, ?, ?, ?) 
                    `
                    params = [exchange, pair, timeframe, indicator, value, dt]
                    break
                case 'MA':
                    sql = `
                    INSERT INTO ma_signals (exchange, pair, timeframe, indicator, value, datetime)
                    VALUES (?, ?, ?, ?, ?, ?) 
                `
                    params = [exchange, pair, timeframe, indicator, value, dt]
                    break
            }
    
            db.run(sql, params)
        } catch (err) {
            logger.error(`saveSignals: ${err}`)
        }
    },

    savePositions: async (exchange, pair, direction, timeframe, entry_price, stop_loss, take_profit, leverage, status) => {
        try {
            await module.exports.openDb()
            let sql, params
            const datetime = new Date().toISOString()
            const dt = moment(datetime).format('YYYY-MM-DD HH:mm:ss')
    
            sql = `
                INSERT INTO open_positions (datetime, exchange, pair, direction, timeframe, entry_price, stop_loss, take_profit, leverage, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `
            params = [dt, exchange, pair, direction, timeframe, entry_price, stop_loss, take_profit, leverage, status]
            
            db.run(sql, params)
        } catch (err) {
            logger.error(`savePosition: ${err}`)
        }
    },

    updatePositions: async (pair, direction, timeframe, status) => {
        try {
            await module.exports.openDb()
            let sql, params
    
            sql = `
                UPDATE open_positions SET status = ? WHERE pair = ? AND direction = ? AND timeframe = ?
            `
            params = [status, pair, direction, timeframe]
    
            db.run(sql, params)
        } catch (err) {
            logger.error(`updatePosition: ${err}`)
        }
    },

    closePositions: async (exchange, pair, direction, timeframe, entry_price, exit_price, leverage, exit_reason) => {
        try {
            await module.exports.openDb()
            let sql, params
            const datetime = new Date().toISOString()
            const dt = moment(datetime).format('YYYY-MM-DD HH:mm:ss')
    
            sql = `
                INSERT INTO closed_positions (datetime, exchange, pair, direction, timeframe, entry_price, exit_price, leverage, exit_reason)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `
            params = [dt, exchange, pair, direction, timeframe, entry_price, exit_price, leverage, exit_reason]
    
            db.run(sql, params)
        } catch (err) {
            logger.error(`closePosition: ${err}`)
        }
    },

    get: async (sqlQuery, params) => {
        return new Promise((resolve, reject) => {
            db.get(sqlQuery, params, (err, row) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(row)
                }
            })
        })
    },
    
    getAll: async (sqlQuery, params) => {
        return new Promise((resolve, reject) => {
            db.all(sqlQuery, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
}