import assert from 'assert'
import path from 'path'

// ---------------------------------
//      Config
// ------------------------------

import config from 'config'

// ---------------------------------
//      Meta
// ------------------------------

import express from 'express'

import expressBodyParser from 'body-parser'
import expressCompression from 'compression'
import expressCORS from 'cors'
import expressHelmet from 'helmet'
import expressLogger from 'morgan'
import expressResponseTime from 'response-time'
import expressTimeout from 'connect-timeout'
import expressSession from 'express-session'

// ---------------------------------
//      HTTP: API Routes
// ------------------------------

import * as routes from './src/routes'
import * as services from './src/services'

import project from './package.json'


// ------------------------------
//      MongoDB: Connection
// ------------------------------

import mongoConnection from './src/db/mongodb'

// ---------------------------------
//      Extensions
// ------------------------------

global.Promise = require('bluebird')

// ---------------------------------
//      Debug
// ------------------------------

global.debug = require('debug')

debug.enable(process.env.DEBUG || 'app*')

// PASSPORT
const Auth0Strategy = require('passport-auth0')
const passport = require('passport')

// ------------------------------
//      HTTP: Server
// ------------------------------

const app = express()

const sentry = require('@sentry/node')

sentry.init({ dsn: config.logging.sentry.key, environment: process.env.NODE_ENV })

// ------------------------------
//      HTTP: SESSION
// ------------------------------

const session = {
    secret: config.auth.SESSION_SECRET || 'CHANGE THIS SECRET',
    cookie: {},
    resave: false,
    saveUninitialized: true,
}

// passport-auth0
const strategy = new Auth0Strategy({
    domain: config.auth.domain || 'gratefuldiary.auth0.com',
    clientID: config.auth.clientID || 'YOUR_CLIENT_ID',
    clientSecret: config.auth.clientSecret || 'YOUR_CLIENT_SECRET', // Replace this with the client secret for your app
    callbackURL: config.auth.callbackURL || 'https://gratefuldiary.co/users/callback',
}, (accessToken, refreshToken, extraParams, profile, done) => {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    return done(null, profile)
},
)

// You can use this section to keep a smaller payload
passport.serializeUser((user, done) => {
    done(null, user)
})

passport.deserializeUser((user, done) => {
    done(null, user)
})

passport.use(strategy)

const server = require('http').Server(app)

const port = Number(process.env.PORT) || 8080

const _debug = debug(`app server ${app.get('workerId') || 'x'}`)

_debug('Initializing...')

_debug('env', {
    NODE_ENV: process.env.NODE_ENV,
    HOSTNAME: process.env.HOSTNAME,
    PORT: port,
    TMP: process.env.TMP,
}, false, null, true)

_debug('config', config, false, null, true)

// ---------------------------------
//      Sentry
// ------------------------------

// ---------------------------------
//      HTTP: Middleware
// ------------------------------

if (/prod/gmi.test(process.env.NODE_ENV) && process.env.BUGSNAG_API_KEY) {
    session.cookie.secure = true // serve secure cookies, requires https
    // The error handler must be before any other error middleware
    app.use(sentry.Handlers.requestHandler())
    app.use(sentry.Handlers.errorHandler())
    app.use(expressLogger('production'))
}

if (/true|1/gmi.test(process.env.COMPRESSION)) {
    app.use(expressCompression())
}


// STATIC
app.use(express.static('public'))

// VIEW ENGINES
app.set("views", path.join(__dirname, "views"))
app.set('view engine', 'pug')


app.use(expressSession(session))

app.use(passport.initialize())
app.use(passport.session())
app.use(services.Middleware.userInViews())

app.use(expressResponseTime())
app.use(expressCORS())
// app.use(expressHelmet())
app.use(expressTimeout(`${process.env.TIMEOUT || 10}s`))
app.use(expressBodyParser.urlencoded({ extended: true }))
app.use(expressBodyParser.json({
    limit: '10mb',
    extended: true,
    // type: (req) => {
    //     return ['application/json', 'application/vnd.api+json'].includes(req.headers['content-type'])
    // }
}))

app.locals.moment = require('moment')

app.locals.chargebee = config.chargebee

app.get('/', (req, res) => {
    if (req.user) {
        res.render('home')
    } else {
        res.render('index')
    }
})
app.get('/faq', (req, res) => {
    res.render('faq', {})
})
app.get('/about', (req, res) => {
    res.render('about', {})
})
app.get('/api', (req, res) => {
    res.send({ status: 'alive' })
})
app.get('/error', (req, res) => {
    throw new Error('Broke!')
})

app.use('/', routes.User)
app.use('/', routes.Email)
app.use('/', routes.Payment)


// ---------------------------------
//      HTTP: Errors
// ------------------------------

// HTTP Errors: Custom Handler
const handleError = (error) => {
    return error
}

mongoConnection.connect()
    .then((db) => {

        _debug('Mongo setup done')
        global.db = db

        // ------------------------------
        //      INDEXES: Fire and forget
        // ------------------------------

        mongoConnection.ensureIndexes(db)
            .then(status => _debug(status))
            .catch(err => _debug(err))

        // ------------------------------
        //      HTTP: Listen
        // ------------------------------

        server.listen(port, process.env.HOSTNAME, () => {
            _debug('Listening on port', port)
        })

        // ------------------------------
        //      IO: Listen
        // ------------------------------

        _debug(`Setting up websockets on ${port}`)

    })

// ------------------------------
//      Process: Events
// ------------------------------

process.on('uncaughtException', (error) => {
    debug('server')('uncaughtException', console.log(error))
})

process.on('unhandledRejection', (reason) => {
    debug('server')('unhandledRejection', console.log(reason))
})

module.exports = server

