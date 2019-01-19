import * as models from '../models'
import * as services from '../services'
import * as utils from '../utils'
import mongoConnection from '../db/mongodb'

const config = require('config')
const sentry = require('@sentry/node')

sentry.init({ dsn: config.logging.sentry.key, environment: process.env.NODE_ENV })

async function run () {
    try {
        // TODO: Optimize
        const users = await services.User.getByTimezone()

        users.forEach(async (user, index) => {
            const ampm = user.config.send_at.split(' ')[1] || 'pm'
            const hour = user.config.send_at.split(' ')[0] || '08'
            const timezone = user.config.timezone || 'America/New_York'
            const day = utils.moment_tz().tz(timezone).format('dddd').toLowerCase()
            const dateTimeToSend = utils.moment_tz.tz(`${utils.moment().format('YYYY-MM-DD')} ${hour} ${ampm}`, "YYYY-MM-DD hh A", timezone)

            const diff = dateTimeToSend.diff(utils.moment_tz().tz(timezone), 'minutes')

            console.info(user.email, hour, ampm, timezone, dateTimeToSend.fromNow(),
                utils.moment_tz().tz(timezone).fromNow(), diff, day, user.config[day])

            // Same am/pm, and herokyu workers run every 10 minutes, give it some leeway
            if (diff >= 0 && diff <= 13 && user.config[day]) {
                console.log(`In the process of sending email for ${user.email}...`)
                try {
                    const random_log = await services.Log.getRandom(user)
                    await services.Email.send(user, 'daily', random_log)
                    console.log(`Sent email for ${user.email} at ${dateTimeToSend.fromNow()}, for ${diff} minutes`)
                } catch (err) {
                    sentry.captureException(err)
                }
            }

            if (index === users.length - 1) {
                console.log('We are done processing for all users.')
                setTimeout(() => {
                    console.log('Exiting successfully....')
                    process.exit(0)
                }, 3000)
            }
        })

    } catch (err) {
        sentry.captureException(err)
    }

}

if (require.main === module) {
    run()
}
