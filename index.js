const OpenFaaS = require('openfaas')
const level = require('level')
const ttl = require('level-ttl')
const hooks = require('level-hooks')

const stateJSON = require('./state.json')
const {parallel} = require('./step-functions')

require('net').createServer().listen();

const openfaas = OpenFaaS('http://localhost:8080')
const db = ttl(level('./db', {valueEncoding: 'json'}), {checkFrequency: 50})

hooks(db)

db.hooks.post('!ttl!', async(change) => {
	const val = change.key.toString('utf8')
	const state = await db.get('NextState')
	const data = await db.get('NextData')
	const stateType = {
		  '!ttl!Task': task
		, '!ttl!Wait': wait
	}
	if(
		change.type === 'del'
		&& (val === '!ttl!Task' || val === '!ttl!Wait'))
	{
		console.log(state.Type, state.Resource || 'none')
		return stateType[val](state, data, next)
	}
})

runStepFunction()
	.catch(console.log)

async function runStepFunction() {
	const startAt = stateJSON.StartAt
	const states = stateJSON.States
	await db.put('NextState', states[startAt])
	await db.put('NextData', '')
	await db.put('Task', states[startAt], {ttl: 75})
}

async function finished() {
	console.log(await db.get('NextData'))
}

async function next(results) {
	const state = await db.get('NextState')

	if(state.Next) {
		stateJSON.States[state.Next].Type === 'Wait'
			? await db.put('Wait', state, {ttl: stateJSON.States[state.Next].Seconds * 1000})
			: await db.put(stateJSON.States[state.Next].Type, state, {ttl: 75})
	}
	if(state.End) {
		await db.put('NextData', results)
		return finished()
	}
	await db.put('NextState', stateJSON.States[state.Next] || '')
	results ? await db.put('NextData', results) : () => {}
}

async function task(state, data, next) {
	try {
		const result = await openfaas.invoke(state["Resource"], data, isJson = false)
		await next(result.body)
	} catch(err) {
		console.log(err)
	}
}

async function wait(state, data, next) {
	await next()
}

