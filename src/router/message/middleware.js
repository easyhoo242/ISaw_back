const { pub, remove, edit, messageList } = require('./service')
const { PARAMS_ERROR } = require('../../util/error-type')

const { OkResult, ErrResult } = require('../../app/responseInfo')

class MessageMiddleware {
	// 发表留言
	async pubMessage(ctx, next) {
		const { id } = ctx.user
		const { content, score } = ctx.request.body
		if (!content) return ctx.app.emit('error', new Error(PARAMS_ERROR), ctx)

		const result = await pub(id, content, score)
		ctx.body = new OkResult('留言发表成功~', result)
	}

	// 删除回复
	async deleteMessage(ctx, next) {
		console.log(123)
		try {
			const { messageId } = ctx.params

			const result = await remove(messageId)

			ctx.body = new OkResult('删除成功~', result)
		} catch (error) {
			console.log(error)
		}
	}

	// 修改
	async editMessage(ctx) {
		try {
			const { messageId } = ctx.params
			const { content = '', score } = ctx.request.body

			await edit(messageId, content, score)

			ctx.body = new OkResult('修改成功~')
		} catch (error) {
			console.log(error)
		}
	}

	async getMessageList(ctx) {
		const result = await messageList()

		ctx.body = new OkResult('获取最新留言接口列表~', result)
	}
}

module.exports = new MessageMiddleware()
