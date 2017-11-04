const OpenFaaS = require('openfaas')

const openfaas = OpenFaaS('http://localhost:8080')

module.exports = async(state, data, next) => {
	console.log(state.Type)
	console.log('    ', 'Branches:')
	state.Branches.forEach(func => console.log('        ', func.StartAt))
	const funcs = state.Branches.map(func => {
		const funcName = func.StartAt
		return openfaas.invoke(func.States[funcName].Resource, data)
	})
	const results = await Promise.all(funcs)

	await next(results.map(res => res.body))
}
