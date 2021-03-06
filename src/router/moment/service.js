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
      SELECT  m.id momentId, m.title title, m.content content, m.look look, 
              m.createTime createTime, m.updateTime updateTime,
        IF(COUNT(u.id),JSON_OBJECT('id', u.id, 'nickname', u.nickname, 'avatarUrl', u.avatar_url), null) author,
        (SELECT COUNT(*) FROM moment_agree mg WHERE mg.moment_id = m.id) agree,
        (SELECT COUNT(*) FROM moment_agree mg WHERE mg.moment_id = m.id AND mg.user_id = u.id) isAgree,
        (SELECT COUNT(1) FROM comment c WHERE c.moment_id = m.id) commentCount,
        (SELECT JSON_OBJECT('id', l.id, 'name', l.name) FROM label l WHERE l.id = m.label_id) label,
        (SELECT JSON_ARRAYAGG(CONCAT('${APP_URL}:${APP_PORT}', '/moment/picture/', p.filename, '-y')) FROM picture p WHERE p.moment_id = m.id) images
      FROM moment m 
      LEFT JOIN users u ON m.user_id = u.id
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
      SELECT m.id momentId, m.title title, m.look look, m.content content, m.createTime createTime, m.updateTime updateTime,
        JSON_OBJECT('id', u.id, 'nickname', u.nickname, 'avatarUrl', u.avatar_url) author,
        (SELECT JSON_ARRAYAGG(CONCAT('${APP_URL}:${APP_PORT}', '/moment/picture/', p.filename, '-y')) FROM picture p WHERE p.moment_id = m.id) images,
        (SELECT COUNT(*) FROM comment c WHERE m.id = c.moment_id) commentCount,
        (SELECT COUNT(*) FROM moment_agree mg WHERE mg.moment_id = m.id) agree,
        (SELECT COUNT(*) FROM moment_agree mg WHERE mg.moment_id = m.id AND mg.user_id = ?) isAgree,
        (SELECT JSON_OBJECT('id', l.id, 'name', l.name) FROM label l WHERE l.id = m.label_id) label
      FROM moment m 
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.label_id = ? AND  m.audit = 0
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
      SELECT m.id momentId,m.look look, m.title title, m.content content, m.createTime createTime, m.updateTime updateTime,
        JSON_OBJECT('id', u.id, 'nickname', u.nickname, 'avatarUrl', u.avatar_url) author,
        (SELECT JSON_ARRAYAGG(CONCAT('${APP_URL}:${APP_PORT}', '/moment/picture/', p.filename, '-y')) FROM picture p WHERE p.moment_id = m.id) images,
        (SELECT COUNT(*) FROM comment c WHERE m.id = c.moment_id) commentCount,
        (SELECT COUNT(*) FROM moment_agree mg WHERE mg.moment_id = m.id) agree,
        (SELECT JSON_OBJECT('id', l.id, 'name', l.name) FROM label l WHERE l.id = m.label_id) label
      FROM moment m 
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.user_id = ? AND m.audit = 0
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
      SELECT  m.id momentId, m.title title, m.look look,
              m.content content, m.createTime createTime, m.updateTime updateTime,
        JSON_OBJECT('id', u.id, 'nickname', u.nickname, 'avatarUrl', u.avatar_url) author,
        (SELECT JSON_ARRAYAGG(CONCAT('${APP_URL}:${APP_PORT}', '/moment/picture/', p.filename, '-y')) FROM picture p WHERE p.moment_id = m.id) images,
        (SELECT COUNT(*) FROM comment c WHERE m.id = c.moment_id) commentCount,
        (SELECT COUNT(*) FROM moment_agree mg WHERE mg.moment_id = m.id) agree,
        (SELECT JSON_OBJECT('id', l.id, 'name', l.name) FROM label l WHERE l.id = m.label_id) label
      FROM moment m 
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.audit = 0
      ORDER BY m.look DESC, m.createTime DESC
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
      WHERE m.audit = 0
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
        m.look look,
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
      WHERE m.audit = 0
      ORDER BY look DESC, agree DESC 
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
        m.look look,
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
      WHERE m.audit = 0
      ORDER BY m.recommend DESC, look DESC
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
      WHERE m.audit = 0
      ORDER BY createTime DESC
      LIMIT ?;
    `

		const [result] = await connection.execute(statement, [limit])

		return result
	}

	async momentListSearchHasKey(keyBoard, label, order, limit, offset) {
		const statement = `
      SELECT
        m.id momentId,
        m.title title,
        m.look look,
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
            AND m.audit = 0
          	OR m.title LIKE '%${keyBoard}%' 
          	AND l.id = ${label}
            AND m.audit = 0
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
          AND audit = 0
          OR title LIKE '%${keyBoard}%' 
          AND label_id = ${label} 
          AND audit = 0;`

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
        m.look look,
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
      WHERE l.id = ${label} AND m.audit = 0
      ORDER BY
        ${order} DESC,
        m.updateTime DESC
      LIMIT ? OFFSET ?;
    `
		try {
			const [result] = await connection.execute(statement, [limit, offset])

			const statement2 = `SELECT COUNT(1) momentCount FROM moment WHERE label_id = ? AND audit = 0;`

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

	// 浏览量
	async look(userId, momentId) {
		try {
			const [[{ look }]] = await connection.execute(
				`SELECT look FROM moment WHERE id = ?;`,
				[momentId]
			)

			const statement = `UPDATE moment SET look = ? WHERE id = ?;`
			const statement2 = `INSERT INTO moment_look (user_id, moment_id) VALUES (?, ?);`

			const [result] = await connection.execute(statement, [look + 1, momentId])

			await connection.execute(statement2, [userId, momentId])

			return result
		} catch (error) {
			console.log(error)
		}
	}

	// 文章统计
	async momentInfo() {
		const statement = `SELECT 
                        COUNT(1) value,
                        SUM(look) lookCount,
                        l.name name,
                        l.id id
                      FROM moment m
                      LEFT JOIN label l ON l.id = m.label_id 
                      GROUP BY label_id;`

		try {
			const [lookResult] = await connection.execute(statement)

			const [commentResult] = await connection.execute(
				` SELECT 
            COUNT(1) value,
            l.name, 
            l.id
          FROM comment c
          LEFT JOIN moment m on m.id = c.moment_id
          LEFT JOIN label l on m.label_id = l.id
          GROUP BY l.id;`
			)

			const [agreeResult] = await connection.execute(
				` SELECT
            COUNT( 1 ) value,
            l.name, 
            l.id
          FROM
            moment_agree mg
            LEFT JOIN moment m ON mg.moment_id = m.id
            LEFT JOIN label l ON m.label_id = l.id 
          GROUP BY
            l.id;`
			)

			const result = {
				lookResult,
				commentResult,
				agreeResult,
			}

			return result
		} catch (error) {
			console.log(error)
		}
	}

	// 数量统计
	async momentData(tableName) {
		const statementToday = ` SELECT COUNT(1) count FROM ${tableName} WHERE createTime > CURDATE()`
		const statementYesterday = `SELECT COUNT(1) count FROM ${tableName} WHERE TO_DAYS( NOW( ) ) - TO_DAYS(createTime) <= 1;`

		const statementByDays = (days) => {
			return `SELECT COUNT(1) count
              FROM ${tableName} 
              WHERE 
                DATE_SUB(CURDATE() , INTERVAL ${days} DAY) <= date(createTime)`
		}

		const statementAll = `SELECT COUNT(1) count FROM ${tableName};`

		const [[{ count: todayCount }]] = await connection.execute(statementToday)
		const [[{ count: yesterdayCount }]] = await connection.execute(
			statementYesterday
		)
		const [[{ count: weekCount }]] = await connection.execute(
			statementByDays(7)
		)
		const [[{ count: monthCount }]] = await connection.execute(
			statementByDays(30)
		)
		const [[{ count: allCount }]] = await connection.execute(statementAll)

		const result = {
			today: todayCount,
			yesterday: yesterdayCount,
			week: weekCount,
			month: monthCount,
			all: allCount,
		}

		return result
	}

	// 每天的数据量
	async countByDay() {
		try {
			const getStatement = (table) => ` 
      select all_day datatime, count(td.createTime) value from 
      -- 查询时间，并统计数据
      (
        -- 生成日期 
        SELECT DATE_FORMAT(DATE_SUB(NOW(), INTERVAL day_p DAY), '%Y-%m-%d') as all_day FROM ( 
          -- 生成一个序号 
          SELECT @day_p:=@day_p + 1 as day_p from 
          -- 数字 5 * 6 = 30 改成自己需要的天数即可 【此处为连接查询 没有链接条件，结果为表1行数 * 表2行数】
          (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4  ) ac1, 
          (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 ) ac2,
          -- 声明从0开始
          (SELECT @day_p:= -1) a
        ) ad 
      ) months LEFT JOIN ${table} td 
      -- 连接上要查询的表，链接条件为生成的日期 等于 表中的日期 
      on months.all_day =  DATE_FORMAT( td.createTime ,'%Y-%m-%d' ) GROUP BY datatime
      ORDER BY datatime ASC
      ;`

			const [momentCount] = await connection.execute(getStatement('moment'))
			const [agreeCount] = await connection.execute(
				getStatement('moment_agree')
			)
			const [lookCount] = await connection.execute(getStatement('moment_look'))
			const [commentCount] = await connection.execute(getStatement('comment'))

			const result = {
				momentCount,
				agreeCount,
				lookCount,
				commentCount,
			}

			return result
		} catch (error) {
			console.log(error)
		}
	}

	// 后台文章搜索
	async backListAll(audit, keyBoard, order, limit, offset) {
		const baseStatement = `SELECT
        m.id momentId,
        m.title title,
        m.look look,
        m.audit,
        m.content content,
        DATE_FORMAT( m.createTime, '%Y-%m-%d %H:%i:%S' ) 'createTime',
        DATE_FORMAT( m.updateTime, '%Y-%m-%d %H:%i:%S' ) 'updateTime',
        JSON_OBJECT( 'id', u.id, 'nickname', u.nickname, 'avatarUrl', u.avatar_url ) author,
        ( SELECT JSON_ARRAYAGG( CONCAT( '${APP_URL}:${APP_PORT}', '/moment/picture/', p.filename, '-y' )) FROM picture p WHERE p.moment_id = m.id ) images,
        ( SELECT COUNT(*) FROM COMMENT c WHERE m.id = c.moment_id ) commentCount,
        ( SELECT COUNT(*) FROM moment_agree mg WHERE mg.moment_id = m.id ) agree,
        ( SELECT COUNT(*) FROM moment_agree mg WHERE mg.moment_id = m.id ) isAgree,
        ( SELECT JSON_OBJECT( 'id', l.id, 'name', l.NAME ) FROM label l WHERE l.id = m.label_id ) label 
      FROM
        moment m
      `

		if (audit === '1') {
			const statement =
				baseStatement +
				`
          LEFT JOIN users u ON m.user_id = u.id
          LEFT JOIN label l ON l.id = m.label_id 
            WHERE
                 m.content LIKE '%${keyBoard}%' AND m.audit = '1' 
              OR m.title LIKE '%${keyBoard}%' AND m.audit = '1'
        ORDER BY
          ${order} DESC,
          m.updateTime DESC
        LIMIT ? OFFSET ?
      `

			try {
				const [result] = await connection.execute(statement, [limit, offset])

				const statement2 = `
          SELECT COUNT(1) momentCount 
          FROM moment m
          WHERE 
            content LIKE '%${keyBoard}%' 
            OR title LIKE '%${keyBoard}%' 
            AND m.audit = '1'
         `

				const [[{ momentCount }]] = await connection.execute(statement2)

				return {
					list: result,
					momentCount,
				}
			} catch (error) {
				console.log(error)
				return error
			}
		} else {
			const statement =
				baseStatement +
				`
        LEFT JOIN users u ON m.user_id = u.id
        LEFT JOIN label l ON l.id = m.label_id 
          WHERE
              m.content LIKE '%${keyBoard}%'
            OR m.title LIKE '%${keyBoard}%' 
            AND m.audit = '0'
        ORDER BY
          ${order} DESC,
          m.updateTime DESC
        LIMIT ? OFFSET ?
    `

			try {
				const [result] = await connection.execute(statement, [limit, offset])

				const statement2 = `
          SELECT COUNT(1) momentCount 
          FROM moment m 
          WHERE m.content LIKE '%${keyBoard}%'
                OR m.title LIKE '%${keyBoard}%' 
                AND m.audit = '0'
        `

				const [[{ momentCount }]] = await connection.execute(statement2)

				return {
					list: result,
					momentCount,
				}
			} catch (error) {
				console.log(error)
				return error
			}
		}
	}

	// 后台文章搜索 不含keyboard
	async backListAllNoKay(audit, order, limit, offset) {
		const baseStatement = `SELECT
        m.id momentId,
        m.title title,
        m.look look,
        m.content content,
        DATE_FORMAT( m.createTime, '%Y-%m-%d %H:%i:%S' ) 'createTime',
        DATE_FORMAT( m.updateTime, '%Y-%m-%d %H:%i:%S' ) 'updateTime',
        m.audit,
        JSON_OBJECT( 'id', u.id, 'nickname', u.nickname, 'avatarUrl', u.avatar_url ) author,
        ( SELECT JSON_ARRAYAGG( CONCAT( '${APP_URL}:${APP_PORT}', '/moment/picture/', p.filename, '-y' )) FROM picture p WHERE p.moment_id = m.id ) images,
        ( SELECT COUNT(*) FROM COMMENT c WHERE m.id = c.moment_id ) commentCount,
        ( SELECT COUNT(*) FROM moment_agree mg WHERE mg.moment_id = m.id ) agree,
        ( SELECT COUNT(*) FROM moment_agree mg WHERE mg.moment_id = m.id ) isAgree,
        ( SELECT JSON_OBJECT( 'id', l.id, 'name', l.NAME ) FROM label l WHERE l.id = m.label_id ) label 
      FROM
        moment m
      `

		if (audit === '1') {
			const statement =
				baseStatement +
				`
          LEFT JOIN users u ON m.user_id = u.id
          LEFT JOIN label l ON l.id = m.label_id 
            WHERE m.audit = '1'
        ORDER BY
          ${order} DESC
        LIMIT ? OFFSET ?
      `

			try {
				const [result] = await connection.execute(statement, [limit, offset])

				const statement2 = `
          SELECT COUNT(1) momentCount 
          FROM moment m
          WHERE m.audit = '1'
         `

				const [[{ momentCount }]] = await connection.execute(statement2)

				return {
					list: result,
					momentCount,
				}
			} catch (error) {
				console.log(error)
				return error
			}
		} else {
			const statement =
				baseStatement +
				`
        LEFT JOIN users u ON m.user_id = u.id
        LEFT JOIN label l ON l.id = m.label_id 
          WHERE m.audit = '0'
        ORDER BY
          ${order} DESC
        LIMIT ? OFFSET ?
    `

			try {
				const [result] = await connection.execute(statement, [limit, offset])

				const statement2 = `
          SELECT COUNT(1) momentCount 
          FROM moment m 
          WHERE m.audit = '0'
        `

				const [[{ momentCount }]] = await connection.execute(statement2)

				return {
					list: result,
					momentCount,
				}
			} catch (error) {
				console.log(error)
				return error
			}
		}
	}

	async backAudit(momentId, type) {
		const statement = `UPDATE moment SET audit = ? WHERE id = ?;`

		try {
			const [result] = await connection.execute(statement, [type, momentId])

			return result
		} catch (error) {
			console.log(error)
		}
	}

	async backLook(offset) {
		console.log(offset)
		try {
			const [result] = await connection.execute(
				` SELECT
            ml.user_id,
            ml.moment_id,
            DATE_FORMAT( ml.createTime, '%Y-%m-%d %H:%i:%S' ) 'createTime',
            JSON_OBJECT( 'id', m.id, 'title', m.title ) moment,
            JSON_OBJECT( 'id', u.id, 'nickname', u.nickname, 'avatar', u.avatar_url ) author 
          FROM
            moment_look ml
            LEFT JOIN moment m ON m.id = ml.moment_id
            LEFT JOIN users u ON u.id = ml.user_id 
            LIMIT 20 OFFSET ?;
        `,
				[offset]
			)

			const [[{ count }]] = await connection.execute(
				`SELECT COUNT(1) count FROM moment_look;`
			)

			return {
				list: result,
				count,
			}
		} catch (error) {
			console.log(error)
		}
	}

	async backLike(offset) {
		const [result] = await connection.execute(
			` SELECT
          mg.user_id,
          mg.moment_id,
          DATE_FORMAT( mg.createTime, '%Y-%m-%d %H:%i:%S' ) 'createTime',
          JSON_OBJECT( 'id', m.id, 'title', m.title ) moment,
          JSON_OBJECT( 'id', u.id, 'nickname', u.nickname, 'avatar', u.avatar_url ) author 
        FROM
          moment_agree mg
          LEFT JOIN moment m ON m.id = mg.moment_id
          LEFT JOIN users u ON u.id = mg.user_id 
          LIMIT 20 OFFSET ?;
      `,
			[offset]
		)

		const [[{ count }]] = await connection.execute(
			`SELECT COUNT(1) count FROM moment_agree;`
		)

		return {
			list: result,
			count,
		}
	}
}

module.exports = new MomentService()
