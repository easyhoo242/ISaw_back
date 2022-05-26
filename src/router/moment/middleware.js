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
	switchMoment,
	momentListSearchHasKey,
	momentListSearchHasNoKey,
	look,
	momentInfo,
	momentData,
	countByDay,
	backListAll,
	backListAllNoKay,
	backAudit,
} = require('./service')

const { CONTENT, PARAMS_ERROR } = require('../../util/error-type')
const { PICTURE_PATH } = require('../../util/file-path')
const {
	agreeExist,
	agree,
	deleteAgree,
} = require('../../common/common-service')

const { OkResult, ErrResult } = require('../../app/responseInfo')

class MomentMiddleware {
	// 发表动态
	async createMoment(ctx, next) {
		const id = ctx.user.id
		const { title, content, label } = ctx.request.body
		if (!title || !content || !label)
			return ctx.app.emit('error', new Error(PARAMS_ERROR), ctx)

		// 校验content长度
		if (content.length > 16000) {
			const err = new Error(CONTENT)
			return ctx.app.emit('error', err, ctx)
		}

		try {
			const result = await insertMoment(id, title, content, label)

			ctx.body = new OkResult('发表动态成功~', result.insertId)
		} catch (error) {
			console.log(error)
			ctx.body = new ErrResult('发表动态失败，标签id不存在~')
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

		if (label) {
			// 根据label获取动态列表
			let { order = '0', userId = '' } = ctx.query
			// （0为最热，1为最新）
			switch (order) {
				case '1':
					order = 'agree'
					break
				case '2':
					order = 'commentCount'
					break
				default:
					order = 'm.updateTime'
			}

			const result = await listInLabel(userId, label, order, offset, limit)
			ctx.body = result
		} else if (userId) {
			// 根据用户id获取动态列表
			const { userId } = ctx.query
			if (!userId) return ctx.app.emit('error', new Error(PARAMS_ERROR), ctx)

			const result = await listInUser(userId, offset, limit)
			ctx.body = result
		} else {
			try {
				const result = await listAll(offset, limit)
				ctx.body = result
			} catch (error) {
				console.log(error)
			}
		}
	}

	async momentListSearch(ctx) {
		const {
			keyBoard = '我',
			label = '1',
			sort = '1',
			limit = '10',
			offset = '0',
		} = ctx.query

		let order = 'm.updateTime'

		// （1为点赞最多，2为评论最多， 3为浏览量， 0为最新）
		switch (sort) {
			case '1':
				order = 'agree'
				break
			case '2':
				order = 'commentCount'
				break
			case '3':
				order = 'look'
				break
			default:
				order = 'm.updateTime'
		}

		if (keyBoard) {
			const result = await momentListSearchHasKey(
				keyBoard,
				label,
				order,
				limit,
				offset
			)

			ctx.body = new OkResult('查询成功~', result)
		} else {
			const result = await momentListSearchHasNoKey(label, order, limit, offset)

			ctx.body = new OkResult('查询成功~', result)
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

			ctx.body = new OkResult('修改动态成功~')
		} catch (error) {
			ctx.body = new ErrResult('修改动态失败，标签id不存在：' + error.message)
		}
	}

	// 删除动态
	async removeMoment(ctx, next) {
		const momentId = ctx.params.momentId
		const result = await remove(momentId)
		ctx.body = new OkResult('删除成功', result)
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
				ctx.body = new OkResult('点赞成功')
			} else {
				await deleteAgree(id, momentId, 'moment')
				ctx.body = new OkResult('取消点赞')
			}
		} catch (error) {
			ctx.body = new ErrResult('点赞失败')
		}
	}

	// 获取随便看看列表
	async getCauseList(ctx) {
		try {
			const { offset = '0' } = ctx.query

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
			const { type = '0' } = ctx.query

			const result =
				type === '0' ? await hotSeeList('6') : await switchMoment('6')

			ctx.body = new OkResult('热门动态查询成功', result)
		} catch (error) {
			console.log(error)
		}
	}

	// 获取最近发表动态列表
	async getLatelyMomentList(ctx) {
		try {
			const result = await hotSeeList('6')

			ctx.body = new OkResult('热门动态查询成功', result)
		} catch (error) {
			console.log(error)
		}
	}

	// 文章浏览
	async momentLook(ctx) {
		try {
			const { momentId } = ctx.params

			const { userId } = ctx.request.body

			const result = await look(userId.toString(), momentId)

			if (!result.affectedRows) {
				return
			}

			ctx.body = new OkResult('浏览成功~')
		} catch (error) {
			console.log(error)
		}
	}

	// 查询文章统计信息
	async getMomentInfo(ctx) {
		const result = await momentInfo()

		ctx.body = new OkResult('查询成功', result)
	}

	// 查询最近几天的动态
	async getMomentData(ctx) {
		try {
			const { type } = ctx.query

			let tableName = 'moment'

			switch (type) {
				case '1':
					tableName = 'moment_look'
					break
				case '2':
					tableName = 'moment_agree'
					break
				case '3':
					tableName = 'comment'
					break
				default:
					tableName = 'moment'
					break
			}

			const result = await momentData(tableName)

			ctx.body = new OkResult('查询成功', result)
		} catch (error) {
			console.log(error)
		}
	}

	// 每天的数据量
	async getCountByDay(ctx) {
		const result = await countByDay()

		ctx.body = new OkResult('查询成功', result)
	}

	// 后台文章搜索
	async backMomentListAllSearch(ctx) {
		const {
			keyBoard = '',
			sort = '1',
			limit = '10',
			offset = '0',
			audit = '0',
		} = ctx.query

		let order = 'm.createTime'

		// （1为点赞最多，2为评论最多， 3为浏览量， 0为最新）
		switch (sort) {
			case '1':
				order = 'agree'
				break
			case '2':
				order = 'commentCount'
				break
			case '3':
				order = 'look'
				break
			case '4':
				order = 'm.createTime'
				break
			default:
				order = 'm.updateTime'
		}

		console.log(offset)

		if (!keyBoard) {
			const result = await backListAllNoKay(audit, order, limit, offset)

			ctx.body = new OkResult('查询成功~', result)
		} else {
			const result = await backListAll(audit, keyBoard, order, limit, offset)

			ctx.body = new OkResult('查询成功~', result)
		}
	}

	// 审核文章
	async postBackAudit(ctx) {
		const { momentId } = ctx.params

		const { type } = ctx.request.body

		const result = await backAudit(momentId, type)

		if (!result.affectedRows) {
			ctx.body = new ErrResult('审核失败')
		}

		ctx.body = new OkResult('审核成功')
	}
}

module.exports = new MomentMiddleware()
