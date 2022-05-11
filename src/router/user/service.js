const connection = require('../../app/database')
const { APP_URL, APP_PORT } = require('../../app/config')

class UserService {
	// 注册
	async create(user) {
		const { username, password, nickname } = user
		const statement =
			'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)'
		try {
			const [result] = await connection.execute(statement, [
				username,
				password,
				nickname,
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
                          (SELECT COUNT (*) FROM moment m WHERE m.user_id = u.id) moment_count,
                          (SELECT COUNT (*) FROM moment_agree mg WHERE mg.user_id = u.id) agree,
                          (SELECT COUNT (*) FROM comment c WHERE c.user_id = u.id) comment_count
                        FROM users u 
                        WHERE id = ?;`

		const statementMomentidList = ` SELECT JSON_ARRAYAGG(id) idList FROM moment WHERE user_id = ?;`

		const statementCommentCount = ` SELECT COUNT(1) count FROM comment WHERE moment_id = ?;`

		const [[{ idList }]] = await connection.execute(statementMomentidList, [id])

		let commentSum = 0

		try {
			for (let i = 0; i < idList.length; i++) {
				const [[{ count }]] = await connection.execute(statementCommentCount, [
					idList[i],
				])

				commentSum += count
			}

			console.log(commentSum)
		} catch (error) {
			console.log(error, '数据错了')
		}

		const [result] = await connection.execute(statement, [id])

		const finalResult = {
			...result,
			comment_count: commentSum,
		}

		console.log(finalResult)

		return finalResult
	}
}

module.exports = new UserService()
