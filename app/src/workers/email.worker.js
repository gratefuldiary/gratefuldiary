import * as models from '../models'
import * as services from '../services'
import * as utils from '../utils'
import mongoConnection from '../db/mongodb'

const config = require('config')
const sentry = require('@sentry/node')

sentry.init({ dsn: config.logging.sentry.key, environment: process.env.NODE_ENV })

async function run () {
    // TODO: Optimize

    // Connect first
    await mongoConnection.connect()
    const users = await services.User.getByTimezone()

    users.forEach(async (user, index) => {
        const ampm = user.config.send_at.split(' ')[1]
        const hour = user.config.send_at.split(' ')[0]
        const timezone = user.config.timezone
        const day = utils.moment_tz().tz(timezone).format('dddd').toLowerCase()
        const dateTimeToSend = utils.moment_tz.tz(`${utils.moment().format('YYYY-MM-DD')} ${hour} ${ampm}`, "YYYY-MM-DD hh A", timezone)

        const diff = dateTimeToSend.diff(utils.moment_tz().tz(timezone), 'minutes')

        console.info(user.email, hour, ampm, timezone, dateTimeToSend.fromNow(), diff, day, user.config[day])

        // Same am/pm, and herokyu workers run every 10 minutes
        if (diff >= 0 && diff <= 11 && user.config[day]) {
            try {
                const random_log = await services.Log.getRandom(user)
                await services.Email.send(user, 'daily', random_log)
                console.log(`Sent email for ${user.email} at ${dateTimeToSend.fromNow()}, for ${diff} minutes`)
            } catch (err) {
                sentry.captureException(err)
            }
        }

        if (index === users.length - 1) {
            setTimeout(() => {
                console.log('We are done processing for all users.')
                process.exit(0)
            }, 5000)
        }
    })

}

if (require.main === module) {
    run()
}
