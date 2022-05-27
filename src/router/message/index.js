const Router = require('koa-router')

const { verifyToken } = require('../../common/common-middleware')

const {
	pubMessage,
	deleteMessage,
	getMessageList,
	editMessage,
} = require('./middleware')

const MessageRouter = new Router({ prefix: '/message' })

MessageRouter.post('/', verifyToken, pubMessage) // 发表留言

MessageRouter.delete('/:messageId', deleteMessage) // 删除留言

MessageRouter.post('/:messageId', editMessage) // 修改留言

MessageRouter.get('/', getMessageList) // 获取留言列表

module.exports = MessageRouter
