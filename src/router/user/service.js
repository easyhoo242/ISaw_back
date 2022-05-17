const connection = require('../../app/database')
const { APP_URL, APP_PORT } = require('../../app/config')

class UserService {
	// 注册
	async create(user) {
		const { username, password, nickname } = user
		const statement =
			'INSERT INTO users (username, password, nickname, type) VALUES (?, ?, ?, ?)'
		try {
			const [result] = await connection.execute(statement, [
				username,
				password,
				nickname,
				3,
			])
			return result
		} catch (error) {
			ctx.body = error
		}
	}

	// 获取用户头像信息
	async avatar(id) {
		const statement = 'SELECT * FROM avatar WHERE user_id = ?'
		const [result] = await connection.execute(statement, [id])
		return result
	}

	// 用户详情
	async userDetail(id) {
		const statement = ` SELECT u.id, u.username, u.nickname, u.avatar_url avatar, 
                            u.sex, u.age, u.email, u.telPhone, u.user_desc 'desc', u.type,
                          (SELECT COUNT (*) FROM moment m WHERE m.user_id = u.id) moment_count,
                          (SELECT COUNT (*) FROM moment_agree mg WHERE mg.user_id = u.id) agree
                        FROM users u 
                        WHERE id = ?;`

		const statementMomentidList = ` SELECT JSON_ARRAYAGG(id) idList FROM moment WHERE user_id = ?;`

		const statementCommentCount = ` SELECT COUNT(1) CommentCount FROM comment WHERE moment_id = ?;`

		const statementAgreeCount = ` SELECT COUNT(1) AgreeCount FROM moment_agree WHERE moment_id = ?;`

		const [[{ idList }]] = await connection.execute(statementMomentidList, [id])

		let commentSum = 0
		let agreeSum = 0

		try {
			if (!idList || !idList.length) {
				commentSum = 0

				agreeSum = 0
			} else {
				for (let i = 0; i < idList.length; i++) {
					// 评论总数
					const [[{ CommentCount }]] = await connection.execute(
						statementCommentCount,
						[idList[i]]
					)
					commentSum += CommentCount

					// 点赞总数
					const [[{ AgreeCount }]] = await connection.execute(
						statementAgreeCount,
						[idList[i]]
					)
					agreeSum += AgreeCount
				}
			}
		} catch (error) {
			console.log(error, '数据错了')
		}

		const [[result]] = await connection.execute(statement, [id])

		const finalResult = {
			...result,
			comment_count: commentSum,
			agree_count: agreeSum,
		}

		return finalResult
	}

	// 修改用户信息

	async change(userId, nickname, sex, age, email, telPhone, desc) {
		const statement = ` UPDATE users
                        SET nickname = ?, sex = ?, age = ?, email = ?, telPhone = ?, user_desc = ?
                        WHERE id = ?`

		try {
			const [result] = await connection.execute(statement, [
				nickname,
				sex,
				age,
				email,
				telPhone,
				desc,
				userId,
			])

			return result
		} catch (error) {
			console.log('错了', error)

			ctx.body = error
		}
	}
}

module.exports = new UserService()
