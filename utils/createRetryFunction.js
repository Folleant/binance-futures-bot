
async function createRetryFunction(fn, maxRetries, retryDelay) {
    let retries = 0

    async function makeRequest() {
        try {
            return await fn()
        } catch (err) {
            if (retries < maxRetries) {
                retries++
                await new Promise(resolve => setTimeout(resolve, retryDelay))
                return makeRequest()
            } else {
                throw err
            }
        }
    }

    return makeRequest()
}


module.exports = createRetryFunction