class BaseResult {
	constructor(msg, data) {
		this.data = data
		this.msg = msg
	}
}

class OkResult extends BaseResult {
	constructor(msg, data) {
		super(msg, data)
		this.flag = true
		this.returnCode = 200
	}
}

class ErrResult extends BaseResult {
	constructor(msg) {
		super(msg)
		this.flag = false
		this.returnCode = 400
	}
}

module.exports = {
	OkResult,
	ErrResult,
}
