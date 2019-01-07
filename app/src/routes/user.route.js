import config from 'config'
import chargebee from 'chargebee'
import express from 'express'
import passport from 'passport'
import * as models from '../models'
import * as services from '../services'
import * as utils from '../utils'

const quotes = [`"If a fellow isn't thankful for what he's got, he isn't likely to be thankful for what he's going to get." - Frank A. Clark`,
    `"Be thankful for what you have; you'll end up having more. If you concentrate on what you don't have, you will never, ever have enough." Oprah Winfrey`,
    `"No one who achieves success does so without the help of others. The wise and confident acknowledge this help with gratitude." Alfred North Whitehead`,
    `"Not obsessing about the future and not beating yourself up over what you don’t have is very important, because then you can pay attention and be grateful for what you do have." Naval`]

const router = express.Router()

// Perform the login, after login Auth0 will redirect to callback
router.get('/users/login', passport.authenticate('auth0', { scope: 'openid email profile'}), (req, res) => {
    res.redirect('/users')
})

// Perform the final stage of authentication and redirect to previously requested URL or '/user'
router.get('/users/callback', (req, res, next) => {
    passport.authenticate('auth0', (err, user, info) => {

        if (err) { return next(err) }
        if (!user) { return res.redirect('/users/login') }

        req.logIn(user, (err) => {
            if (err) { return next(err) }
            const returnTo = req.session.returnTo
            delete req.session.returnTo
            res.redirect(returnTo || '/users')
        })

    })(req, res, next)
})

// Perform session logout and redirect to homepage
router.get('/users/logout', (req, res) => {
    req.logout()
    res.redirect('/')
})

/* GET user profile. */
router.get('/users', services.Middleware.secured(), async (req, res, next) => {

    const email = req.user.email
    let user = await services.User.get(email)

    if (user) {
        // RETURNING USER
        res.locals.newuser = false
        // console.log('NEW USER?', res.locals.newuser, user)
    } else {
        // NEW USER
        user = await services.User.save(req.user)
        await services.Email.send(user, 'welcome')
        res.locals.newuser = true
        // console.log('NEW USER?', res.locals.newuser, user)
    }

    res.locals.logs = await services.Log.list(user)
    res.locals.quotes = quotes

    res.status(200).render('home')
})


router.get('/users/account', services.Middleware.secured(), async (req, res) => {
    res.locals.timezones = res.locals.timezones || utils.moment_tz.tz.names()
    res.locals.send_ats = res.locals.send_ats || ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
        .map(i => [`${i} am`, `${i} pm`])
        .reduce((i, j) => i.concat(j))
    res.locals.chargebee = config.chargebee
    res.render('account')
})

router.post('/users/account', services.Middleware.secured(), async (req, res) => {
    try {
        const user = await services.User.updateConfig(res.locals.user, req.body)
        res.locals.user = user
        res.locals.message = 'Your account is updated.'
    } catch (e) {
        res.locals.message = 'Something went wrong.'
    }
    res.redirect('/users/account')
})

router.post('/users/waiting', (req, res, next) => {
    const data = req.body || {}

    const email = data.email
    const user = { email }

    services.User.addToWaitingList(user)
        .then(() => {
            // res.status(200)
            res.status(200).render('index', { message: 'Thanks, we will get back' })
        })
        .catch((err) => {
            res.status(400).send(err)
        })
})

// ALIAS
router.get('/account', services.Middleware.secured(), (req, res) => {
    res.redirect('/users/account')
})

router.get('/home', services.Middleware.secured(), (req, res) => {
    res.redirect('users')
})

export default router

