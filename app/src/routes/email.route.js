import config from 'config'
import express from 'express'
import * as models from '../models'
import * as services from '../services'
import * as utils from '../utils'

const router = express.Router()

const webhook = config.email.sparkpost.webhook || ''

router.post(`/email/${webhook}`, (req, res, next) => {

    const data = req.body || {}

    console.log('Email: We have incoming')

    try {
        const msg = data[0]
        if (msg && msg.msys) {
            if (msg.msys.relay_message) {

                // OK, we have a relay message
                const message = msg.msys.relay_message
                const log = services.Email.getLog(message)

                log.created_at = utils.moment().toISOString()
                log.updated_at = utils.moment().toISOString()
                // { text, email, _id }

                console.log('Email: LOG!')

                services.Log.save(log)
                    .then((saved_log) => {
                        return res.status(200).json(models.Log.transformBeforeSend(saved_log))
                    })
                    .catch((err) => {
                        console.log('ERR', err)
                        return res.status(400).send(err)
                    })
            } else if (msg.msys.message_event) {
                // OK, we have a relay event
                res.status(200).send()
            } else {
                // OK this is for creating the webhook initially
                res.status(200).send()
            }

        } else {
            res.status(200).send()
        }
    } catch (e) {
        res.status(200).send()
    }
})

export default router

