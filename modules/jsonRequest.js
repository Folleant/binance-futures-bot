const fs = require('fs')
const logger = require('../utils/logger')


async function checkingJsonRequest(exchange, pair, timeframe, indicator, value) {
    // Checking the folder for signals, if not already created.
    if (!fs.existsSync('./jsons')) {
        fs.mkdirSync('./jsons')
        logger.info('✔️ A folder for json data has been created')
    }


    const jsonDatas = indicatorsJSON()
    const json_indicator = {
        SI: jsonDatas.SI,
        TR: jsonDatas.TR,
        MA: jsonDatas.MA
    }


    // Signal data processing, data recording.
    const datetime = new Date().toISOString()

    const objectRequest = {
        exchange,
        pair,
        timeframe,
        indicator,
        value: indicator === 'TR' || indicator === 'MA' ? parseFloat(value) : value,
        datetime
    }

    const filename = json_indicator[indicator]

    fs.readFile(filename, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // The file doesn't exist, create it
                fs.writeFile(filename, JSON.stringify([objectRequest]), err => {
                    if (err) {
                        logger.error('❌ Error when creating json and writing data to json', err)
                        return res.status(500).send('Error saving data to json')
                    }
                    //logger.info('✔️ Successful, the signal is saved in json')
                })
            } else {
                logger.error('❌ Error when trying to read json', err)
                return res.status(500).send('Error read data')
            }
        } else {
            // JSON file already exists, read data from the file.
            const read_signals = JSON.parse(data)
            read_signals.push(objectRequest)

            fs.writeFile(filename, JSON.stringify(read_signals), err => {
                if (err) {
                    logger.error('❌ Error when reading data from a file', err)
                    return res.status(500).send('Error when reading data from a file')
                }
                //logger.info('✔️ The signal has been successfully saved to a file and read')
            })
        }
    })
}

function indicatorsJSON() {
    const json_file = {
        SI: 'jsons/SI.json',
        TR: 'jsons/TR.json',
        MA: 'jsons/MA.json'
    }

    return {
        SI: json_file.SI,
        TR: json_file.TR,
        MA: json_file.MA
    }
}


module.exports = { checkingJsonRequest, indicatorsJSON }