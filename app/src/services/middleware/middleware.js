import * as services from '../'

const secured = () => {
    return (req, res, next) => {
        if (req.user) { return next() }
        req.session.returnTo = req.originalUrl
        res.redirect('/users/login')
    }
}

const userInViews = () => {
    return async (req, res, next) => {
        if (req.user) {
            if (!res.locals.user) {
                const user = await services.User.get(req.user._json.email)
                if (!user) {
                    res.locals.user = req.user._json
                    req.user = req.user._json
                } else {
                    res.locals.user = user
                    req.user = user
                }
            }
        }
        next()
    }
}


module.exports = {
    secured,
    userInViews,
}
