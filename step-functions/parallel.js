const OpenFaaS = require('openfaas')
//const stateJSON = require('../../state')

const openfaas = OpenFaaS('http://localhost:8080') // TODO should pull form ENV?

module.exports = async(state, data, db, next) => {
	console.log(state.Type)
	console.log('    ', 'Branches:')
	state.Branches.forEach(func => console.log('        ', func.StartAt))
	const funcs = state.Branches.map(func => {
		const funcName = func.StartAt
		console.log(func.States[funcName].Resource)
		return openfaas.invoke(func.States[funcName].Resource, data)
	})
	const results = await Promise.all(funcs)
	await db.put('NextData', results.map(res => res.body))
	await next(state)
}
