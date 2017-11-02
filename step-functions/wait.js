const stateJSON = require('../state.json')

module.exports = async(state, data, db) => {
	console.log(state.Type)
	await db.put('Wait', 'foo' ,{ttl: state['Seconds'] * 1000})
	await db.put('NextState', stateJSON.States[state.Next])
}
