import schema from './schemas/user.schema'
import * as utils from '../utils'

const uuidv4 = require('uuid/v4')

const User = {
    schema,
}

User.getConfig = (user, config) => {
    if (config) {
        return {
            timezone: config.timezone,
            send_at: config.send_at ? config.send_at : '08 pm',
            monday: config.monday === 'true',
            tuesday: config.tuesday === 'true',
            wednesday: config.wednesday === 'true',
            thursday: config.thursday === 'true',
            friday: config.friday === 'true',
            saturday: config.saturday === 'true',
            sunday: config.sunday === 'true',
        }
    } else {
        return {
            timezone: user.geoip.time_zone,
            send_at: '08 pm',
            monday: true,
            tuesday: false,
            wednesday: false,
            thursday: true,
            friday: true,
            saturday: false,
            sunday: true,
        }
    }

}

User.transformBeforeSaveForConfig = (user, config) => {
    user.config = User.getConfig(user, config)
    user.first_name = config.first_name
    user.last_name = config.last_name
    return user
}

User.transformBeforeSaveForSubscription = (user, subscription) => {
    user.subscription = subscription
    return user
}

User.transformBeforeSave = (user) => {
    user._id = user.email
    user.token = user.token || uuidv4()

    user.geoip = user['https://geoip']
    delete user['https://geoip']

    user.first_name = user['https://metadata'].first_name
    user.last_name = user['https://metadata'].last_name
    delete user['https://metadata']

    user.created_at = user.created_at || new Date().toISOString()
    user.updated_at = new Date().toISOString()
    user.config = User.getConfig(user)

    return user
}

User.getEmail = (user) => {
    return user.email || user.id
}

User.getDayInTimezone = (user) => {
    return utils.moment_tz().tz(user.config.timezone || 'America/New_York').format('MMM Do, YYYY')
}

User.getFirstName = (user) => {
    return user.first_name
}

User.getToken = (user) => {
    return user.token
}

User.transformBeforeSend = (user) => {
    user.email = user._id
    delete user.password
    delete user._id
    if (user.token) {
        delete user.token._id
    }
    return user
}

export default User
