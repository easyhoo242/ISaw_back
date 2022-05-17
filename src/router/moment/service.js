const connection = require('../../app/database')
const { APP_URL, APP_PORT } = require('../../app/config')

class MomentService {
	// 发表动态
	async insertMoment(id, title, content, label) {
		const statement =
			'INSERT INTO moment (user_id, title, content, label_id) VALUES (?, ?, ?, ?);'
		const result = await connection.execute(statement, [
			id,
			title,
			content,
			label,
		])

		return result[0]
	}

	// 添加标签
	// async addLAbel(id, labels) {
	//   try {
	//     for(let labelId of labels) {
	//       const statement2 = "INSERT INTO moment_label (moment_id, label_id) VALUES (?, ?)"
	//       await connection.execute(statement2, [id, labelId])
	//     }

	//     return "添加标签成功"
	//   } catch (error) {
	//     return error
	//   }
	// }

	// 获取动态详情
	async detail(id) {
		const statement = `
      SELECT m.id momentId, m.title title, m.content content, m.createTime createTime, m.updateTime updateTime,
        IF(COUNT(u.id),JSON_OBJECT('id', u.id, 'nickname', u.nickname, 'avatarUrl', u.avatar_url), null) author,
        (SELECT COUNT(*) FROM moment_agree mg WHERE mg.moment_id = m.id) agree,
        (SELECT COUNT(1) FROM comment c WHERE c.moment_id = m.id) commentCount,
        (SELECT JSON_OBJECT('id', l.id, 'name', l.name) FROM label l WHERE l.id = m.label_id) label,
        (SELECT JSON_ARRAYAGG(CONCAT('${APP_URL}:${APP_PORT}', '/moment/picture/', p.filename, '-y')) FROM picture p WHERE p.moment_id = m.id) images
      FROM moment m LEFT JOIN users u ON m.user_id = u.id
      WHERE m.id = ?
      GROUP BY m.id
    `
		try {
			const [result] = await connection.execute(statement, [id])
			if (result[0].momentId == null) {
				return '该动态不存在~'
			}
			return result[0]
		} catch (error) {
			return error
		}
	}

	// 获取label获取动态列表
	async listInLabel(id, label, order, offset, limit) {
		const statement = `
      SELECT m.id momentId,m.title title, m.content content, m.createTime createTime, m.updateTime updateTime,
        JSON_OBJECT('id', u.id, 'nickname', u.nickname, 'avatarUrl', u.avatar_url) author,
        (SELECT JSON_ARRAYAGG(CONCAT('${APP_URL}:${APP_PORT}', '/moment/picture/', p.filename, '-y')) FROM picture p WHERE p.moment_id = m.id) images,
        (SELECT COUNT(*) FROM comment c WHERE m.id = c.moment_id) commentCount,
        (SELECT COUNT(*) FROM moment_agree mg WHERE mg.moment_id = m.id) agree,
        (SELECT COUNT(*) FROM moment_agree mg WHERE mg.moment_id = m.id AND mg.user_id = ?) isAgree,
        (SELECT JSON_OBJECT('id', l.id, 'name', l.name) FROM label l WHERE l.id = m.label_id) label
      FROM moment m LEFT JOIN users u
      ON m.user_id = u.id
      WHERE m.label_id = ?
      ORDER BY ${order} DESC
      LIMIT ?, ?
    `
		try {
			const [result] = await connection.execute(statement, [
				id,
				label,
				offset,
				limit,
			])

			const [[{ momentCount }]] = await connection.execute(
				`SELECT COUNT(1) momentCount FROM moment WHERE label_id = ?`,
				[label]
			)

			const [[labelInfo]] = await connection.execute(
				`SELECT id, name FROM label  WHERE id = ?;`,
				[label]
			)

			return {
				list: result,
				momentCount,
				labelInfo,
			}
		} catch (error) {
			return error
		}
	}

	// 根据用户id获取动态列表
	async listInUser(userId, offset, limit) {
		const statement = `
      SELECT m.id momentId, m.title title, m.content content, m.createTime createTime, m.updateTime updateTime,
        JSON_OBJECT('id', u.id, 'nickname', u.nickname, 'avatarUrl', u.avatar_url) author,
        (SELECT JSON_ARRAYAGG(CONCAT('${APP_URL}:${APP_PORT}', '/moment/picture/', p.filename, '-y')) FROM picture p WHERE p.moment_id = m.id) images,
        (SELECT COUNT(*) FROM comment c WHERE m.id = c.moment_id) commentCount,
        (SELECT COUNT(*) FROM moment_agree mg WHERE mg.moment_id = m.id) agree,
        (SELECT JSON_OBJECT('id', l.id, 'name', l.name) FROM label l WHERE l.id = m.label_id) label
      FROM moment m LEFT JOIN users u
      ON m.user_id = u.id
      WHERE m.user_id = ?
      ORDER BY m.createTime DESC
      LIMIT ?, ?
    `
		try {
			const [result] = await connection.execute(statement, [
				userId,
				offset,
				limit,
			])

			const [[{ momentCount }]] = await connection.execute(
				`SELECT COUNT(1) momentCount FROM moment  WHERE user_id = ?;`,
				[userId]
			)

			return {
				list: result,
				momentCount,
			}
		} catch (error) {
			console.log(error)
		}
	}

	// 全部动态
	async listAll(offset, limit) {
		const statement = `
      SELECT m.id momentId, m.title title, m.content content, m.createTime createTime, m.updateTime updateTime,
        JSON_OBJECT('id', u.id, 'nickname', u.nickname, 'avatarUrl', u.avatar_url) author,
        (SELECT JSON_ARRAYAGG(CONCAT('${APP_URL}:${APP_PORT}', '/moment/picture/', p.filename, '-y')) FROM picture p WHERE p.moment_id = m.id) images,
        (SELECT COUNT(*) FROM comment c WHERE m.id = c.moment_id) commentCount,
        (SELECT COUNT(*) FROM moment_agree mg WHERE mg.moment_id = m.id) agree,
        (SELECT JSON_OBJECT('id', l.id, 'name', l.name) FROM label l WHERE l.id = m.label_id) label
      FROM moment m LEFT JOIN users u
      ON m.user_id = u.id

      ORDER BY m.createTime DESC
      LIMIT ?, ?
    `
		try {
			const [result] = await connection.execute(statement, [offset, limit])

			const [[{ momentCount }]] = await connection.execute(
				`SELECT COUNT(1) momentCount FROM moment;`
			)

			return {
				list: result,
				momentCount,
			}
		} catch (error) {
			console.log(error)
		}
	}

	// 修改动态内容
	async update(id, label, title, content) {
		// 修改内容
		const statement =
			'UPDATE moment SET title = ?, content = ?, label_id = ? WHERE id = ?'
		await connection.execute(statement, [title, content, label, id])

		return '修改成功~'
	}

	// 删除动态对应的所有标签
	// async delLabel(id) {
	//   const statement2 = "DELETE FROM moment_label WHERE moment_id = ?"
	//   await connection.execute(statement2, [id])
	// }

	// 删除动态
	async remove(id) {
		const statement = 'DELETE FROM moment WHERE id = ?'
		try {
			const [result] = await connection.execute(statement, [id])
			return '删除动态成功~'
		} catch (error) {
			return '删除动态失败' + error.message
		}
	}

	// 获取动态配图信息
	async picture(filename) {
		const statement = 'SELECT * FROM picture WHERE filename = ?'
		const [result] = await connection.execute(statement, [filename])
		return result
	}

	// 随便看看列表
	async causeList(limit, offset) {
		const statement = `
      SELECT
        m.id momentId,
        m.title title,
        m.content content,
        m.createTime createTime,
        m.updateTime updateTime,
        JSON_OBJECT( 'id', u.id, 'nickname', u.nickname, 'avatarUrl', u.avatar_url ) author,
        ( SELECT JSON_ARRAYAGG( CONCAT( '${APP_URL}:${APP_PORT}', '/moment/picture/', p.filename, '-y' )) 
          FROM picture p WHERE p.moment_id = m.id 
        ) images,
        ( SELECT COUNT(*) FROM COMMENT c WHERE m.id = c.moment_id ) commentCount,
        ( SELECT COUNT(*) FROM moment_agree mg WHERE mg.moment_id = m.id ) agree,
        ( SELECT COUNT(*) FROM
            moment_agree mg 
          WHERE mg.moment_id = m.id 
        ) isAgree,
        ( SELECT JSON_OBJECT( 'id', l.id, 'name', l.NAME ) FROM label l WHERE l.id = m.label_id ) label 
      FROM
        moment m
      LEFT JOIN users u ON m.user_id = u.id 
      ORDER BY agree DESC
      LIMIT ? OFFSET ?;
    `

		const [result] = await connection.execute(statement, [limit, offset])

		return result
	}

	// 热门文章列表
	async hotSeeList(limit) {
		const statement = `
      SELECT
        m.id momentId,
        m.title title,
        m.content content,
        m.createTime createTime,
        m.updateTime updateTime,
        JSON_OBJECT( 'id', u.id, 'nickname', u.nickname, 'avatarUrl', u.avatar_url ) author,
        ( SELECT JSON_ARRAYAGG( CONCAT( '${APP_URL}:${APP_PORT}', '/moment/picture/', p.filename, '-y' )) 
          FROM picture p WHERE p.moment_id = m.id 
        ) images,
        ( SELECT COUNT(*) FROM COMMENT c WHERE m.id = c.moment_id ) commentCount,
        ( SELECT COUNT(*) FROM moment_agree mg WHERE mg.moment_id = m.id ) agree,
        ( SELECT JSON_OBJECT( 'id', l.id, 'name', l.NAME ) FROM label l WHERE l.id = m.label_id ) label 
      FROM
        moment m
      LEFT JOIN users u ON m.user_id = u.id
      ORDER BY agree DESC, commentCount DESC 
      LIMIT ?;
    `

		const [result] = await connection.execute(statement, [limit])

		return result
	}

	// 精选导读
	async switchMoment(limit) {
		const statement = `
      SELECT
        m.id momentId,
        m.title title,
        m.content content,
        m.createTime createTime,
        m.updateTime updateTime,
        m.recommend re,
        JSON_OBJECT( 'id', u.id, 'nickname', u.nickname, 'avatarUrl', u.avatar_url ) author,
        ( SELECT JSON_ARRAYAGG( CONCAT( '${APP_URL}:${APP_PORT}', '/moment/picture/', p.filename, '-y' )) 
          FROM picture p WHERE p.moment_id = m.id 
        ) images,
        ( SELECT COUNT(*) FROM COMMENT c WHERE m.id = c.moment_id ) commentCount,
        ( SELECT COUNT(*) FROM moment_agree mg WHERE mg.moment_id = m.id ) agree,
        ( SELECT JSON_OBJECT( 'id', l.id, 'name', l.NAME ) FROM label l WHERE l.id = m.label_id ) label 
      FROM
        moment m
      LEFT JOIN users u ON m.user_id = u.id
      ORDER BY m.recommend DESC
      LIMIT ?;
    `

		const [result] = await connection.execute(statement, [limit])

		return result
	}

	// 最近发表动态接口
	async latelyMomentList(limit) {
		const statement = `
      SELECT
        m.id momentId,
        m.title title,
        m.content content,
        m.createTime createTime,
        m.updateTime updateTime,
        JSON_OBJECT( 'id', u.id, 'nickname', u.nickname, 'avatarUrl', u.avatar_url ) author,
        ( SELECT JSON_ARRAYAGG( CONCAT( '${APP_URL}:${APP_PORT}', '/moment/picture/', p.filename, '-y' )) 
          FROM picture p WHERE p.moment_id = m.id 
        ) images,
        ( SELECT COUNT(*) FROM COMMENT c WHERE m.id = c.moment_id ) commentCount,
        ( SELECT COUNT(*) FROM moment_agree mg WHERE mg.moment_id = m.id ) agree,
        ( SELECT JSON_OBJECT( 'id', l.id, 'name', l.NAME ) FROM label l WHERE l.id = m.label_id ) label 
      FROM
        moment m
      LEFT JOIN users u ON m.user_id = u.id
      ORDER BY createTime DESC
      LIMIT ?;
    `

		const [result] = await connection.execute(statement, [limit])

		return result
	}

	// 文章列表搜索接口
	async momentListSearchHasKey(keyBoard, label, order, limit, offset) {
		const statement = `
      SELECT
        m.id momentId,
        m.title title,
        m.content content,
        m.createTime createTime,
        m.updateTime updateTime,
        JSON_OBJECT( 'id', u.id, 'nickname', u.nickname, 'avatarUrl', u.avatar_url ) author,
        ( SELECT JSON_ARRAYAGG( CONCAT( '${APP_URL}:${APP_PORT}', '/moment/picture/', p.filename, '-y' )) FROM picture p WHERE p.moment_id = m.id ) images,
        ( SELECT COUNT(*) FROM COMMENT c WHERE m.id = c.moment_id ) commentCount,
        ( SELECT COUNT(*) FROM moment_agree mg WHERE mg.moment_id = m.id ) agree,
        ( SELECT COUNT(*) FROM moment_agree mg WHERE mg.moment_id = m.id ) isAgree,
        ( SELECT JSON_OBJECT( 'id', l.id, 'name', l.NAME ) FROM label l WHERE l.id = m.label_id ) label 
      FROM
        moment m
        LEFT JOIN users u ON m.user_id = u.id
        LEFT JOIN label l ON l.id = m.label_id 
          WHERE
          	m.content LIKE '%${keyBoard}%' 
          	AND l.id = ${label}
          	OR m.title LIKE '%${keyBoard}%' 
          	AND l.id = ${label}
      ORDER BY
        ${order} DESC,
        m.updateTime DESC
      LIMIT ? OFFSET ?
    `

		try {
			const [result] = await connection.execute(statement, [limit, offset])

			const statement2 = `
        SELECT COUNT(1) momentCount 
        FROM moment 
        WHERE 
          content LIKE '%${keyBoard}%' 
          AND label_id = ${label}
          OR title LIKE '%${keyBoard}%' 
          AND label_id = ${label} ;`

			const [[{ momentCount }]] = await connection.execute(statement2, [label])

			return {
				list: result,
				momentCount,
			}
		} catch (error) {
			console.log(error)
			return error
		}
	}

	async momentListSearchHasNoKey(label, order, limit, offset) {
		const statement = `
      SELECT
        m.id momentId,
        m.title title,
        m.content content,
        m.createTime createTime,
        m.updateTime updateTime,
        JSON_OBJECT( 'id', u.id, 'nickname', u.nickname, 'avatarUrl', u.avatar_url ) author,
        ( SELECT JSON_ARRAYAGG( CONCAT( '${APP_URL}:${APP_PORT}', '/moment/picture/', p.filename, '-y' )) FROM picture p WHERE p.moment_id = m.id ) images,
        ( SELECT COUNT(*) FROM COMMENT c WHERE m.id = c.moment_id ) commentCount,
        ( SELECT COUNT(*) FROM moment_agree mg WHERE mg.moment_id = m.id ) agree,
        ( SELECT COUNT(*) FROM moment_agree mg WHERE mg.moment_id = m.id ) isAgree,
        ( SELECT JSON_OBJECT( 'id', l.id, 'name', l.NAME ) FROM label l WHERE l.id = m.label_id ) label 
      FROM
        moment m
        LEFT JOIN users u ON m.user_id = u.id
        LEFT JOIN label l ON l.id = m.label_id 
      WHERE l.id = ${label}
      ORDER BY
        ${order} DESC,
        m.updateTime DESC
      LIMIT ? OFFSET ?;
    `
		try {
			const [result] = await connection.execute(statement, [limit, offset])

			const statement2 = `SELECT COUNT(1) momentCount FROM moment WHERE label_id = ?;`

			const [[{ momentCount }]] = await connection.execute(statement2, [label])

			return {
				list: result,
				momentCount,
			}
		} catch (error) {
			console.log(error)
			return error
		}
	}

	async look(id) {
		try {
			const [[{ look }]] = await connection.execute(
				`SELECT look FROM moment WHERE id = ?;`,
				[id]
			)

			const statement = `UPDATE moment SET look = ? WHERE id = ?;`

			const [result] = await connection.execute(statement, [look + 1, id])

			return result
		} catch (error) {
			console.log(error)
		}
	}
}

module.exports = new MomentService()
