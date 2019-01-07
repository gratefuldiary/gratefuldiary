import config from 'config'
import chargebee from 'chargebee'
import express from 'express'
import passport from 'passport'
import * as models from '../models'
import * as services from '../services'
import * as utils from '../utils'

const router = express.Router()

chargebee.configure({site: config.chargebee.site, api_key: config.chargebee.key})

// https://github.com/chargebee/chargebee-checkout-samples/blob/master/api/back-end/javascript/express/index.js
router.post("/chargebee/generate_portal_session", services.Middleware.secured(), async (req, res) => {
    console.log('generate_portal_session', req.user.email)
    const session = await chargebee.portal_session.create({
        customer: {
            id: req.user.email,
            email: req.user.email,
        },
    }).request()
    res.send(session.portal_session)
})

router.post('/chargebee/generate_checkout_new_url', services.Middleware.secured(), async (req, res) => {
    console.log('generate_checkout_new_url', req.user.email)
    const hp = await chargebee.hosted_page.checkout_new({
        subscription: {
            plan_id: req.body.plan || "quarterly",
        },
        customer: {
            email: req.user.email,
            id: req.user.email,
        },
    }).request()
    res.send(hp.hosted_page)
})

router.post(`/chargebee/webhook/${config.chargebee.webhook}`, async (req, res) => {
    const webhook = req.body

    if (webhook && webhook.event_type && ['subscription_created', 'subscription_changed', 'subscription_cancelled', 'subscription_renewed', 'subscription_deleted'].includes(webhook.event_type)) {
        const subscription = {...webhook.content.subscription}
        const email = webhook.content.customer.id
        console.log(`Subscription for ${email}`, subscription)
        await services.User.updateSubscription({ email }, subscription)
    }
    res.status(200).send()
})

// router.post("/chargebee/generate_checkout_existing_url", services.Middleware.secured(), async (req, res) => {
//     console.log('generate_checkout_existing_url', req.user.email)
//     const hp = await chargebee.hosted_page.checkout_existing({
//         subscription : {
//             id : req.user.plan.subscription
//         },
//     }).request()
//     res.send(hp.hosted_page)
// })

export default router
