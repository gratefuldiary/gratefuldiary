/* global Promise:true debug:true APIError:true APIResponse:true APIStatus:true */
import config from 'config'
import { ObjectID } from 'mongodb'

import connection from '../db/mongodb'
import * as models from '../models'
import * as services from '../services'

const LOGS_COLLECTION = 'logs'

// NOTE: We encruypt and decrypt here before save/gets
const save = (log) => {
    log.text = services.Email.encrypt(log.text)

    return connection.connect()
        .then(db => db.collection(LOGS_COLLECTION).insert(log))
        .then((result) => {
            const saved_log = result.ops[0]
            return Promise.resolve(saved_log)
        })
        .catch((err) => {
            return Promise.reject(err)
        })
}

const list = (user, limit = 100, skip = 0) => {
    return connection.connect()
        .then(db => db.collection(LOGS_COLLECTION)
            .find({ email: user.email }).sort({ created_at: -1 }).limit(limit).skip(skip).toArray())
        .then((logs) => {
            return logs.map((log) => {
                log.text = services.Email.decrypt(log.text)
                return log
            })
        })
}

const getRandom = async (user) => {
    const logs = await list(user)
    return logs[Math.floor(Math.random() * logs.length)];
}

module.exports = {
    save,
    list,
    getRandom,
}

if (require.main === module) {

    const _log = { text: 'This is the email content',
        email: 'hello@gmail.com',
        _id: `hello@gmail.com:<CALB-26Zdny_GtnRSyJaNHrT96qP+am6Z+bxjWPjiERRx1XiM3w@mail.gmail.com>${new Date()}`,
        headers:
        { "Date": 'Sun, 4 Mar 2018 11:47:55 -0600',
            "To": 'reply@gratefuldiary.co',
            "From": 'Gaurav C <hello@gmail.com>',
            "Subject": 'Re: Hello from Grateful Diary',
            'Content-Type': 'multipart/alternative; boundary="94eb2c071058ffa59e056699d04b"' },
        created_at: '2018-03-04T17:53:29.217Z',
        updated_at: '2018-03-04T17:53:29.218Z' }

    save(_log)
        .then(success => console.log(success))

    list({ email: 'hello@gmail.com'})
        .then(success => console.log(success))

}

