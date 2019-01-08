const config = require('config')
const debug = require('debug')
const moment = require('moment')
const SparkPost = require('sparkpost')

const client = new SparkPost(config.email.sparkpost.key)

const MailParser = require('mailparser').MailParser
const ReplyParser = require('email-reply-parser') // https://github.com/crisp-im/email-reply-parser
const templates = require('./templates/html')

// https://www.sparkpost.com/docs/tech-resources/inbound-email-relay-webhook/#add-mx-records
// RELAY: https://www.sparkpost.com/docs/tech-resources/inbound-email-relay-webhook/
// + https://developers.sparkpost.com/api/relay-webhooks.html
// API + EXAMPLES: hhttps://github.com/SparkPost/node-sparkpost
// + https://github.com/SparkPost/node-sparkpost/tree/master/examples/relayWebhooks

const send = (user = {}, type = 'daily', log) => {

    return client.transmissions.send({
        options: {
            open_tracking: true,
            click_tracking: true,
        },
        substitution_data: {
            name: user.first_name,
            date: moment().format('MMM Do, YYYY'),
            before: log ? moment(log.created_at).fromNow() : null,
            log: log ? log.text : null,
        },
        content: {
            from: {
                email: config.env === 'production' ? [user.token || 'entry', '@gratefuldiary.co'].join('') : [user.token || 'entry', '@test.gratefuldiary.co'].join(''),
                name: 'Grateful Diary',
            },
            subject: config.env === 'production' ? templates[type].subject : ['TEST', templates[type].subject].join(':'),
            html: templates[type].html,
        },
        recipients: [
            { address: user.email },
        ],
    })
}

const getLog = (message) => {
    const content = message.content.text
    const headers = {}

    message.content.headers.forEach(h => Object.assign(headers, h))

    return {
        text: new ReplyParser().read(content).getVisibleText(),
        email: message.msg_from,
        _id: ['SPARKPOST', message.msg_from, headers['Message-ID']].join(':'),
        headers: {
            "Date": headers.Date,
            "To": headers.To,
            "From": headers.From,
            "Subject": headers.Subject,
            'Content-Type': headers['Content-Type'],
        },
    }
}

const parseAttachment = (content) => {
    // TODO
    // let body = content.email_rfc822
    // let parser = new MailParser({
    //     streamAttachments: true
    // })

    // if (content.email_rfc822_is_base64) {
    //     body = Buffer.from(body, 'base64')
    // }

    // parser.on('attachment', (attachment, mail) => {
    //     console.log(`Writing ${attachment.fileName}...`)
    //     attachment.stream.pipe(fs.createWriteStream(attachment.generatedFileName))
    // })

    // parser.write(body)
    // parser.end()

    // parser.on('end', (mail) => {
    //     console.log('CONTENT', body)
    // })
}

module.exports = {
    send,
    getLog
}


if (require.main === module) {

    debug.enable(config.debug)
    config.env = config.env || 'development'
    const log = debug('Email')

    log('KEY:', config.email.sparkpost.key)
    send({first_name: 'x', token: 'asdfasdf', email: 'cggaurav+gd@gmail.com'})
        .then((data) => {
            log("Sent?", data)
            // { results:
            //    { total_rejected_recipients: 0,
            //      total_accepted_recipients: 1,
            //      id: '156773902553884416' } }
        })
        .catch((err) => {
            log('Oopsie', err)
        })
}
