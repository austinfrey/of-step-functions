const stateJSON = require('../../state')

module.exports = async(state, trigger) {
	const nextState = state['Next']
	const isDone = state['Next']
		? false
		: true
	const data = await db.get('NextData')
	await trigger(stateJSON.States[nextState], data, isDone)
}
