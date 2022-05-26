const fs = require('fs')

const errorType = require('../../util/error-type')
const service = require('./service')
const common = require('../../common/common-service')
const md5password = require('../../util/md5password')
const { AVATAR_PATH } = require('../../util/file-path')

const { OkResult, ErrResult } = require('../../app/responseInfo')

class UserMiddleware {
	// 用户验证
	async verifyUser(ctx, next) {
		const { username, password, nickname } = ctx.request.body

		// 判断账号密码是否为空
		if (!username || !password || !nickname) {
			const err = new Error(errorType.USERNAME_PASSWORD_IS_NULL)
			return ctx.app.emit('error', err, ctx)
		}

		// 校验账号密码规则（4-16，数字或字母组成 -- 数字,英文,字符中的两种以上，长度4-16）
		const usernameRule = /^[a-zA-Z0-9]{4,16}$/
		const passwordRule =
			/^(?![0-9]+$)(?![a-z]+$)(?![A-Z]+$)(?!([^(0-9a-zA-Z)])+$).{4,16}$/
		if (!usernameRule.test(username) || !passwordRule.test(password)) {
			const err = new Error(errorType.USERNAME_PASSWORD_RULE)
			return ctx.app.emit('error', err, ctx)
		}

		// 判断账号是否存在
		const result1 = await common.userExist('username', username)
		if (result1.length) {
			const err = new Error(errorType.USERNAME_EXIST)
			return ctx.app.emit('error', err, ctx)
		}

		// 判断昵称是否存在
		const result2 = await common.userExist('nickname', nickname)
		if (result2.length) {
			const err = new Error(errorType.NICKNAME_EXIST)
			return ctx.app.emit('error', err, ctx)
		}

		await next()
	}

	// 密码加密
	async passwordHandle(ctx, next) {
		ctx.request.body.password = md5password(ctx.request.body.password)
		await next()
	}

	// 注册
	async createUser(ctx, next) {
		// 获取请求参数
		const user = ctx.request.body

		// 数据库操作
		await service.create(user)

		// 返回结果
		ctx.body = new OkResult('注册成功')
	}

	// 读取头像
	async getAvatar(ctx, next) {
		const { userId } = ctx.params
		const result = await service.avatar(userId)

		ctx.response.set('Content-Type', result.mimetype)

		ctx.body = fs.createReadStream(`${AVATAR_PATH}/${result[0].filename}`)
	}

	// 用户信息
	async getUserDetail(ctx, next) {
		const { userId } = ctx.params

		try {
			const result = await service.userDetail(userId)
			ctx.body = new OkResult('用户信息获取成功', result)
		} catch (error) {
			console.log(error)
			ctx.body = new ErrResult(error)
		}
	}

	// 修改用户信息
	async changeUserInfo(ctx) {
		const { userId } = ctx.params

		const {
			nickname,
			sex,
			age,
			email,
			telPhone,
			desc,
			type = '',
		} = ctx.request.body

		const result = await service.change(
			userId,
			nickname,
			sex,
			age,
			email,
			telPhone,
			desc,
			type
		)

		if (result.affectedRows) {
			ctx.body = new OkResult('修改成功')
		} else {
			ctx.body = new ErrResult('修改失败')
		}
	}

	// 修改密码
	async changeUserPsw(ctx) {
		const { userId } = ctx.params
		const { oldPsw, newPsw } = ctx.request.body

		const res = await service.changePsw(
			userId,
			md5password(oldPsw),
			md5password(newPsw)
		)

		if (!res.flag) {
			ctx.body = new ErrResult(res.msg)
		} else {
			ctx.body = new OkResult(res.msg)
		}
	}

	// 获取用户列表
	async getUsersList(ctx) {
		const result = await service.userList()

		ctx.body = result
	}

	// 删除用户
	async postEditUser(ctx) {
		const { id } = ctx.params

		const result = await service.deleteUser(id)

		if (!result.affectedRows) {
			ctx.body = new ErrResult('删除失败')
			return
		}

		ctx.body = new OkResult('删除成功', id)
	}
}

module.exports = new UserMiddleware()
