const config = require('config')
const crypto = require('crypto')
const debug = require('debug')

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

module.exports = {
    encrypt,
    decrypt,
}

if (require.main === module) {

    debug.enable(config.debug)
    const log = debug('Encrypt')

    log('KEY:', config.email.sparkpost.key)

    let e = encrypt(`I am hopeful to push these udpates soon
        and what do I expect for new lines?



        and spaces?`)
    console.log(e)
    console.log(decrypt(e))

}
