/* global Promise:true debug:true APIError:true APIResponse:true APIStatus:true */
import config from 'config'
import { ObjectID } from 'mongodb'

import connection from '../db/mongodb'
import * as models from '../models'

const USERS_COLLECTION = 'users'
const WAITING_COLLECTION = 'waiting'

export default {

    save (user) {
        return connection.connect()
            .then(db => db.collection(USERS_COLLECTION)
                .findAndModify(
                    { email: models.User.getEmail(user) },
                    {},
                    { $set: models.User.transformBeforeSave(user) },
                    { upsert: true, new: true },
                ))
            .then((result) => {
                const saved_user = result.value
                return Promise.resolve(saved_user)
            })
            .catch((err) => {
                return Promise.reject(err)
            })
    },

    updateConfig (user, config) {
        return connection.connect()
            .then(db => db.collection(USERS_COLLECTION)
                .findAndModify(
                    { email: models.User.getEmail(user) },
                    {},
                    { $set: models.User.transformBeforeSaveForConfig(user, config) },
                    { upsert: false, new: true },
                ))
            .then((result) => {
                const saved_user = result.value
                return Promise.resolve(saved_user)
            })
            .catch((err) => {
                return Promise.reject(err)
            })

    },

    updateSubscription (user, subscription) {
        return connection.connect()
            .then(db => db.collection(USERS_COLLECTION)
                .findAndModify(
                    { email: models.User.getEmail(user) },
                    {},
                    { $set: models.User.transformBeforeSaveForSubscription(user, subscription) },
                    { upsert: false, new: true },
                ))
            .then((result) => {
                const saved_user = result.value
                return Promise.resolve(saved_user)
            })
            .catch((err) => {
                return Promise.reject(err)
            })

    },

    get (email) {
        return connection.connect()
            .then(db => db.collection(USERS_COLLECTION)
                .findOne({ email }))
    },

    getByTimezone() {
        return connection.connect()
            .then(db => db.collection(USERS_COLLECTION)
                .find({}).toArray())
    },

    findByEmail (user) {
        return connection.connect()
            .then(db => db.collection(USERS_COLLECTION)
                .findOne({ _id: user.email }))
    },

    // NOTE: TO BE DEPRECATED
    addToWaitingList(user) {
        return connection.connect()
            .then(db => db.collection(WAITING_COLLECTION)
                .insert(user))
            .then((result) => {
                const saved_user = result.ops[0]
                return Promise.resolve(saved_user)
            })
            .catch((err) => {
                return Promise.reject(err)
            })
    },
}
