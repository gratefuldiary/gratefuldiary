export default {
    type: 'object',
    id: 'user',
    description: 'User',
    properties: {
        _type: {
            type: 'string',
            default: 'User',
        },
        first_name: {
            type: 'string',
        },
        last_name: {
            type: 'string',
        },
        email: {
            type: 'string',
            format: 'email',
        },
        token: {
            type: 'string',
            format: 'email',
        },
        config: {
            type: 'object',
            properties: {
                timezone: {
                    type: 'datetime',
                },
                send_at: {
                    type: 'datetime',
                },
                monday: {
                    type: 'boolean',
                    default: true,
                },
                tuesday: {
                    type: 'boolean',
                    default: true,
                },
                wednesday: {
                    type: 'boolean',
                    default: true,
                },
                thursday: {
                    type: 'boolean',
                    default: true,
                },
                friday: {
                    type: 'boolean',
                    default: true,
                },
                saturday: {
                    type: 'boolean',
                    default: true,
                },
                sunday: {
                    type: 'boolean',
                    default: true,
                },

            },
            required: [
                'timezone',
                'send_at',
            ],
            additionalProperties: false,

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
        'email',
        'first_name',
        'last_name',
        'config',
    ],
    additionalProperties: false,
}
