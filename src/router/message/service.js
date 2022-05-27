const connection = require('../../app/database')

class MessageService {
	// 发表留言
	async pub(uId, content, score) {
		const statement =
			'INSERT INTO `message` (user_id, content, score) VALUES (?, ?, ?)'
		try {
			await connection.execute(statement, [uId, content, score])
			return '发表留言成功'
		} catch (error) {
			return '发表留言失败'
		}
	}

	// 删除留言
	async remove(id) {
		const statement = 'DELETE FROM message WHERE id = ?'
		try {
			await connection.execute(statement, [id])
			return '删除成功'
		} catch (error) {
			return '删除失败' + error.message
		}
	}

	// 修改留言
	async edit(messageId, content, score) {
		const statement = 'UPDATE message SET content = ?, score = ? WHERE id = ?;'
		try {
			await connection.execute(statement, [content, score, messageId])
			return '修改成功'
		} catch (error) {
			return '修改失败' + error.message
		}
	}

	// 全部留言
	async messageList(offset) {
		const statement = `
    SELECT m.id, m.content, m.score,
      DATE_FORMAT( m.createTime, '%Y-%m-%d %H:%i:%S' ) 'createTime',
      JSON_OBJECT('id', u.id, 'nickname', u.nickname, 'avatarUrl', u.avatar_url) user
    FROM message m LEFT JOIN users u ON m.user_id = u.id
    ORDER BY createTime DESC
    LIMIT 10 OFFSET ?
    `

		try {
			const [result] = await connection.execute(statement, [offset])

			const [[{ count }]] = await connection.execute(
				`SELECT COUNT(1) count from message;`
			)

			return {
				list: result,
				count,
			}
		} catch (error) {
			return error.message
		}
	}
}

module.exports = new MessageService()
