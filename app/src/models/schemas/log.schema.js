export default {
    type: 'object',
    id: 'log',
    description: 'Log',
    properties: {
        _type: {
            type: 'string',
            default: 'Log',
        },
        _id: {
            type: 'string',
            description: 'Message ID from the provider in the case things come twice',
        },
        email: {
            type: 'string',
            format: 'email',
        },
        text: {
            type: 'string',
        },
        created_at: {
            type: 'string',
            format: 'date-time',
        },
        updated_at: {
            type: 'string',
            format: 'date-time',
        },
    },
    required: [
        '_id', 'log', 'email', 'created_at',
    ],
    additionalProperties: false,
}
