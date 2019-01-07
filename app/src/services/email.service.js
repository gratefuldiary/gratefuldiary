const config = require('config')
const debug = require('debug')
const moment = require('moment')
const SparkPost = require('sparkpost')

const client = new SparkPost(config.email.sparkpost.key)

const MailParser = require('mailparser').MailParser
const ReplyParser = require('email-reply-parser') // https://github.com/crisp-im/email-reply-parser
const templates = require('./templates/html')
const crypto = require('crypto')

const ENCRYPTION_KEY = config.email.encryption.key // Must be 256 bytes (32 characters)
const IV_LENGTH = 16 // For AES, this is always 16

// https://gist.github.com/vlucas/2bd40f62d20c1d49237a109d491974eb
// https://gist.github.com/cggaurav/77c78613c24aad0b1905469290d0f3e4
const encrypt = (text, email = '') => {

    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv('aes-256-cbc', new Buffer([ENCRYPTION_KEY, email].join('_').slice(-32)), iv)
    let encrypted = cipher.update(text)

    encrypted = Buffer.concat([encrypted, cipher.final()])

    return `${iv.toString('hex')}:${encrypted.toString('hex')}`
}

const decrypt = (text, email = '') => {
    const textParts = text.split(':')

    const iv = new Buffer(textParts.shift(), 'hex')

    const encryptedText = new Buffer(textParts.join(':'), 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', new Buffer([ENCRYPTION_KEY, email].join('_').slice(-32)), iv)
    let decrypted = decipher.update(encryptedText)

    decrypted = Buffer.concat([decrypted, decipher.final()])

    return decrypted.toString()
}

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
                email: config.env === 'production' ? [user.token || 'entry', '@gratefuldiary.co'].join('') : [user.token || 'entry', '@www.gratefuldiary.co'].join(''),
                name: 'Grateful Diary',
            },
            subject: config.env === 'production' ? templates[type].subject : ['TEST', templates[type].subject].join(':'),
            html: templates[type].html,
        },
        recipients: [
            { address: user.email || 'cggaurav@gmail.com' },
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
    getLog,
    encrypt,
    decrypt,
}


if (require.main === module) {

    debug.enable(config.debug)
    config.env = config.env || 'development'
    const log = debug('Email')

    log('KEY:', config.email.sparkpost.key)
    send({first_name: 'x', token: 'asdfasdf'})
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

    client.inboundDomains.list()
        .then((data) => {
            console.log('List of all inbound domains', data)
        })
        .catch(err => {
            console.log('Whoops! Something went wrong')
            console.log(err)
        })

    client.relayWebhooks.list()
        .then((data) => {
            console.log('List of all relayWebhooks', JSON.stringify(data))
        })
        .catch((err) => {
            console.log('Whoops! Something went wrong')
            console.log(err)
        })

    // client.relayWebhooks.delete('174881122451469151')
    //     .then((data) => {
    //         console.log('Deleted relaywebhook', data)
    //     })
    //     .catch(err => {
    //         console.log('Whoops! Something went wrong')
    //         console.log(err)
    //     })

    client.relayWebhooks.create({
            name: 'All incoming webhooks',
            target: 'https://gratefuldiary-markable.fwd.wf/email',
            match: {
                // protocol: "SMTP",
                domain: "www.gratefuldiary.co"
            }
        })
        .then(data => {
            console.log('Created incoming webhook')
            console.log(data)
        })
        .catch(err => {
            console.log('Whoops! Something went wrong')
            console.log(err)
        })

    const e = encrypt(`I am hopeful to push these udpates soon
        and what do I expect for new lines?



        and spaces?`)
    console.log(e)
    console.log(decrypt(e))

    // e = encrypt('a@b.com', 'asdf asdf asdf asdf \n asdf asdf asdf asdf asdf asdf asdf asdf \n')
    // console.log(e)
    // console.log(decrypt('a@b.com', e))

}
