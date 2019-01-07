import config from 'config'
import { MongoClient } from 'mongodb'

// https://github.com/rlondner/aws-stepfunctions-samples/blob/master/restaurants/index.js
// Performance optimization Step 1: declare the database connection object outside the handler method
let _db = null
const url = config.db.mongodb.url

const USERS_COLLECTION = 'users'
const LOGS_COLLECTION = 'logs'
// OPTIONS: http://mongodb.github.io/node-mongodb-native/2.2/reference/connecting/connection-settings/
// DETAILS: https://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html

module.exports = {
    connect: () => {
        return new Promise((resolve, reject) => {
            return MongoClient.connect(url, {
                // autoReconnect: true,
                // keepAlive: 1,
                // poolSize: 1,
                // reconnectTries: 2,
                // sslValidate: false,
                // connectTimeoutMS: 3 * 1000,
                // socketTimeoutMS: 5 * 1000
                // ssl: true,
            })
                .then((db) => {
                    console.log('Connected', url)
                    _db = db
                    return resolve(db)
                })
                .catch((err) => {
                    console.error('CANNOT CONNECT TO MONGODB', err)
                    return reject(err)
                })
        })
    },
    close: () => {
    // ISSUES 1. https://jira.mongodb.org/browse/NODE-982
        return new Promise((resolve, reject) => {
            _db.close(true, (err, status) => {
                console.log('CLOSE()', err, status)
                if (err) {
                    return reject(err)
                }
                return resolve()
            })
        })

    },
    ensureIndexes: (db) => {
        return Promise.all([
            db.collection(USERS_COLLECTION).ensureIndex({ email: 1 }, { unique: true }),
            db.collection(USERS_COLLECTION).ensureIndex({ config: 1 }),
            db.collection(USERS_COLLECTION).ensureIndex({ subscription: 1 }),
            db.collection(USERS_COLLECTION).ensureIndex({ token: 1 }),
            db.collection(LOGS_COLLECTION).ensureIndex({ email: 1 }),
            db.collection(LOGS_COLLECTION).ensureIndex({ created_at: 1 }),
        ])
    },
}
