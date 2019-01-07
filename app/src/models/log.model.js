import schema from './schemas/log.schema'

const Log = {
    schema,
}

Log.transformBeforeSend = (log) => {
    delete log.text
    return log
}

export default Log
