const fs = require('fs')
const path = require('path')

const {
	insertMoment,
	detail,
	listInLabel,
	listInUser,
	listAll,
	update,
	remove,
	picture,
	causeList,
	hotSeeList,
} = require('./service')

const { CONTENT, PARAMS_ERROR } = require('../../util/error-type')
const { PICTURE_PATH } = require('../../util/file-path')
const {
	agreeExist,
	agree,
	deleteAgree,
} = require('../../common/common-service')

const { OkResult } = require('../../app/responseInfo')

class MomentMiddleware {
	// 发表动态
	async createMoment(ctx, next) {
		const id = ctx.user.id
		const { title, content, label } = ctx.request.body
		if (!title || !content || !label)
			return ctx.app.emit('error', new Error(PARAMS_ERROR), ctx)

		// 校验content长度
		if (content.length > 1000) {
			const err = new Error(CONTENT)
			return ctx.app.emit('error', err, ctx)
		}

		try {
			const result = await insertMoment(id, title, content, label)
			ctx.body = { message: '发表动态成功', id: result.insertId }
		} catch (error) {
			ctx.body = '发表动态失败，标签id不存在：' + error.message
		}
	}

	// 获取动态详情
	async momentDetail(ctx, next) {
		const { momentId } = ctx.params
		const result = await detail(momentId)
		ctx.body = result
	}

	// 获取动态列表
	async momentList(ctx, next) {
		const { label, userId, offset = '0', limit = '10' } = ctx.query

		const page = offset != '1' ? offset - 1 + '0' : '0'

		console.log(label, userId)
		if (label) {
			// 根据label获取动态列表
			let { order = '0', userId = '' } = ctx.query
			// （0为最热，1为最新）
			switch (order) {
				case '0':
					order = 'agree'
					break
				default:
					order = 'm.updateTime'
			}

			const result = await listInLabel(userId, label, order, page, limit)
			ctx.body = result
		} else if (userId) {
			// 根据用户id获取动态列表
			const { userId } = ctx.query
			if (!userId) return ctx.app.emit('error', new Error(PARAMS_ERROR), ctx)

			const result = await listInUser(userId, page, limit)
			ctx.body = result
		} else {
			try {
				const result = await listAll(page, limit)
				ctx.body = result
			} catch (error) {
				console.log(error)
			}
		}
	}

	// 修改动态
	async updateMoment(ctx, next) {
		const { title, content, label } = ctx.request.body
		const momentId = ctx.params.momentId
		if (!title || !content || !label)
			return ctx.app.emit('error', new Error(PARAMS_ERROR), ctx)

		try {
			// 修改内容
			await update(momentId, label, title, content)

			ctx.body = '修改动态成功~'
		} catch (error) {
			ctx.body = '修改动态失败，标签id不存在：' + error.message
		}
	}

	// 删除动态
	async removeMoment(ctx, next) {
		const momentId = ctx.params.momentId
		const result = await remove(momentId)
		ctx.body = result
	}

	// 读取动态配图
	async getPicture(ctx, next) {
		const { filename } = ctx.params
		try {
			// 图片末尾有 -y 则表示为压缩后的图片，数据库中只保存了压缩前的图片信息
			const zfilename = filename.replace('-y', '')
			const result = await picture(zfilename)
			ctx.response.set('content-type', result[0].mimetype)
			ctx.body = fs.createReadStream(path.join(PICTURE_PATH, filename))
		} catch (error) {
			ctx.body = error
		}
	}

	// 动态点赞或点踩
	async goAgree(ctx, next) {
		const { id } = ctx.user
		const { momentId } = ctx.params
		try {
			const result = await agreeExist(id, momentId, 'moment')
			if (!result.length) {
				await agree(id, momentId, 'moment')
				ctx.body = '点赞成功'
			} else {
				await deleteAgree(id, momentId, 'moment')
				ctx.body = '取消点赞'
			}
		} catch (error) {
			ctx.body = '点赞失败'
		}
	}

	// 获取随便看看列表
	async getCauseList(ctx) {
		try {
			// const offset = (Math.floor(Math.random() * (5 - 1 + 1)) + 1).toString()
			const offset = '0'

			// limit offset
			const result = await causeList('6', offset)

			ctx.body = new OkResult('获取随便看看列表成功~ : ', result)
		} catch (err) {
			console.log(err)
		}
	}

	// 获取热门动态列表
	async getHotseeList(ctx) {
		try {
			const result = await hotSeeList('3')

			ctx.body = new OkResult('热门动态查询成功', result)
		} catch (error) {
			console.log(error)
		}
	}
}

module.exports = new MomentMiddleware()
