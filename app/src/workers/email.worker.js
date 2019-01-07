import * as models from '../models'
import * as services from '../services'
import * as utils from '../utils'

const config = require('config')

async function run () {
    const users = await services.User.getByTimezone()
    users.forEach(async (user, index) => {
        const ampm = user.config.send_at.split(' ')[1]
        const hour = user.config.send_at.split(' ')[0]
        const timezone = user.config.timezone
        const day = utils.moment_tz().tz(timezone).format('dddd').toLowerCase()
        const dateTimeToSend = utils.moment_tz.tz(`${utils.moment().format('YYYY-MM-DD')} ${hour} ${ampm}`, "YYYY-MM-DD hh A", timezone)

        const diff = dateTimeToSend.diff(utils.moment_tz().tz(timezone), 'minutes')

        console.log(user.email, hour, ampm, timezone, dateTimeToSend.fromNow(), diff, day, user.config[day])

        // Same am/pm, and herokyu workers run every 10 minutes
        if (diff >= 0 && diff <= 11 && user.config[day]) {
            const random_log = await services.Log.getRandom(user)
            await services.Email.send(user, 'daily', random_log)
            console.log(`Sent email for ${user.email} at ${dateTimeToSend().fromNow()}, for ${diff} minutes`)
        }

        if (index === users.length - 1) {
            setTimeout(() => {
                console.log('We are done processing for all users.')
                process.exit(0)
            }, 1000)
        }
    })

}

if (require.main === module) {
    run()
}
