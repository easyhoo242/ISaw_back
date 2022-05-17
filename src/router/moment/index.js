const Router = require('koa-router')

const {
	verifyToken,
	verifyPermission,
} = require('../../common/common-middleware')
const {
	createMoment,
	momentDetail,
	momentList,
	updateMoment,
	removeMoment,
	getPicture,
	goAgree,
	getCauseList,
	getHotseeList,
	getLatelyMomentList,
	momentListSearch,
	momentLook,
} = require('./middleware')

const momentRouter = new Router({ prefix: '/moment' })

momentRouter.post('/', verifyToken, createMoment) // 发表动态

momentRouter.get('/:momentId', momentDetail) // 动态详情

momentRouter.get('/', momentList) // 动态列表

momentRouter.post(
	'/:momentId',
	verifyToken,
	verifyPermission('moment'),
	updateMoment
) // 修改动态

momentRouter.delete(
	'/:momentId',
	verifyToken,
	verifyPermission('moment'),
	removeMoment
) // 删除动态

momentRouter.get('/picture/:filename', getPicture) // 读取图片
momentRouter.post('/:momentId/like', verifyToken, goAgree) // 点赞

momentRouter.get('/cause/:id', getCauseList) //随便看看
momentRouter.get('/hotsee/:id', getHotseeList) //热门文章
momentRouter.get('/lately/:id', getLatelyMomentList) //最近发表

momentRouter.get('/search/:id', momentListSearch) //搜索列表

momentRouter.post('/:momentId/look', momentLook)

module.exports = momentRouter
