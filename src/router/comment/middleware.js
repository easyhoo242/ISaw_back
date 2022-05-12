const {
	pub,
	reply,
	remove,
	listInMoment,
	listInUser,
	listInComment,
	LatelyComment,
} = require('./service')
const { PARAMS_ERROR } = require('../../util/error-type')
const {
	agreeExist,
	agree,
	deleteAgree,
} = require('../../common/common-service')

const { OkResult, ErrResult } = require('../../app/responseInfo')

class CommentMiddleware {
	// 发表评论
	async pubComment(ctx, next) {
		const { id } = ctx.user
		const { content, momentId } = ctx.request.body
		if (!content || !momentId)
			return ctx.app.emit('error', new Error(PARAMS_ERROR), ctx)

		const result = await pub(id, content, momentId)
		ctx.body = new OkResult('评论发表成功~', result)
	}

	// 回复评论
	async replyComment(ctx, next) {
		const { id } = ctx.user
		const { content, momentId } = ctx.request.body
		const { commentId } = ctx.params
		try {
			await reply(id, content, momentId, commentId)
			ctx.body = '回复成功'
		} catch (error) {
			ctx.body = error
		}
	}

	// 删除回复
	async deleteComment(ctx, next) {
		const { commentId } = ctx.params
		const result = await remove(commentId)

		ctx.body = new OkResult('删除成功~', result)
	}

	// 获取动态的评论列表
	async commentList(ctx, next) {
		const { momentId, commentId, offset = '1', limit = '5' } = ctx.query

		if (momentId) {
			// 根据动态获取一级评论
			let { order = '0', userId = '' } = ctx.query
			switch (order) {
				case '1':
					order = 'agree'
					break
				default:
					order = 'c.createTime'
			}
			const result = await listInMoment(userId, momentId, order, offset, limit)

			ctx.body = new OkResult('一级评论获取成功', result)
		} else if (commentId) {
			// 根据评论id获取二级评论（回复）
			const { userId = '' } = ctx.query
			const result = await listInComment(userId, commentId)
			ctx.body = new OkResult('二级评论获取成功', result)
		} else {
			// 根据用户id获取
			const { id } = ctx.query
			if (!id) return ctx.app.emit('error', new Error(PARAMS_ERROR), ctx)

			const result = await listInUser(id, offset, limit)
			ctx.body = new OkResult('用户发表的评论获取成功', result)
		}

		// else if(userId){  // 根据用户id获取
		//   const { offset='0', limit='10' } = ctx.query
		//   // if(!userId) return ctx.app.emit('error', new Error(PARAMS_ERROR), ctx)

		//   const result = await listInUser(userId, offset, limit)
		//   ctx.body = result
		// }else {

		//   const result = await listInComment(id, commentId)
		//   ctx.body = result
		// }
	}

	// 获取动态某个评论的回复列表
	// async commentDetailList(ctx, next) {
	//   const { id } = ctx.user
	//   const { commentId } = ctx.params
	//   const result = await listInComment(id, commentId)
	//   ctx.body = result
	// }

	// 点赞
	async goAgree(ctx, next) {
		const { id } = ctx.user
		const { commentId } = ctx.params
		try {
			const result = await agreeExist(id, commentId, 'comment')
			if (!result.length) {
				await agree(id, commentId, 'comment')
				ctx.body = '点赞成功'
			} else {
				await deleteAgree(id, commentId, 'comment')
				ctx.body = '取消点赞'
			}
		} catch (error) {
			ctx.body = '点赞失败'
		}
	}

	// 最近评论列表

	async getLatelyComment(ctx) {
		console.log(123)
		const result = await LatelyComment()

		ctx.body = new OkResult('获取最新评论接口列表~', result)
	}
}

module.exports = new CommentMiddleware()
