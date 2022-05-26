const Router = require('koa-router')

const userRouter = new Router({ prefix: '/users' })

const {
	verifyUser,
	passwordHandle,
	createUser,
	getAvatar,
	getUserDetail,
	changeUserInfo,
	changeUserPsw,
	getUsersList,
	postEditUser,
} = require('./middleware')

const { verifyToken } = require('../../common/common-middleware')

userRouter.post('/', verifyUser, passwordHandle, createUser) // 注册

userRouter.get('/:userId/avatar', getAvatar) // 查看头像

userRouter.get('/:userId', getUserDetail) // 用户信息

userRouter.post('/:userId', changeUserInfo) // 修改信息

userRouter.post('/:userId/psw', verifyToken, changeUserPsw) // 修改密码

userRouter.get('/back/userList/:id', getUsersList) // 用户列表

userRouter.delete('/back/userDelete/:id', postEditUser) // 删除用户

module.exports = userRouter
