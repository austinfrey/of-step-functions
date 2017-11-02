const OpenFaaS = require('openfaas')

const openfaas = OpenFaaS('http://localhost:8080') // TODO should pull form ENV?

module.exports = async(state, data, db, advance) => {
	try {
		console.log(state.Type, state.Resource)
		const result = await openfaas.invoke(state["Resource"], data, isJson = false)
		await db.put('NextData', result.body)
		await advance(state)
	} catch(err) {
		console.log(err) //TODO should log to DB
	}
}
