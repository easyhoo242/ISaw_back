const Router = require('koa-router')

const userRouter = new Router({ prefix: '/users' })

const {
	verifyUser,
	passwordHandle,
	createUser,
	getAvatar,
	getUserDetail,
} = require('./middleware')

userRouter.post('/', verifyUser, passwordHandle, createUser) // 注册

userRouter.get('/:userId/avatar', getAvatar) // 查看头像

userRouter.get('/:userId', getUserDetail) // 用户信息

module.exports = userRouter
