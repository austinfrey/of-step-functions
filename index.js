const OpenFaaS = require('openfaas')
const level = require('level')
const ttl = require('level-ttl')
const hooks = require('level-hooks')

const stateJSON = require('./state.json')
const {task, parallel} = require('./step-functions')

require('net').createServer().listen();

const openfaas = OpenFaaS('http://localhost:8080')
const db = ttl(level('./db', {valueEncoding: 'json'}), {checkFrequency: 50})

hooks(db)

db.hooks.post('!ttl!Wait', async(change) => {
	if(change.type === 'del') {
		try {
			const state = await db.get('NextState')
			const data = await db.get('NextData')
			await triggerFunction(false)
		} catch(err) {
			console.log(err)
		}
	}
})

runStepFunction()
	.catch(console.log)

async function runStepFunction() {
	const startAt = stateJSON.StartAt
	const states = stateJSON.States
	await db.put('NextState', states[startAt])
	await db.put('NextData', '')
	await triggerFunction()
}

async function triggerFunction(isDone) {
	const data = await db.get('NextData')
	if(isDone) {
		return console.log(data)
	}
	const state = await db.get('NextState')
	const stateTypes = {'Task': task, 'Wait': wait, 'Parallel': parallel}
	const type = state.Type

	return await stateTypes[type](state, data, next)
}

async function next(results) {
	const state = await db.get('NextState')
	await db.put('NextState', stateJSON.States[state.Next])
	await db.put('NextData', results)
	await triggerFunction(!!state['End'])
}

async function wait(state, data, next) {
	console.log(state.Type)
	await db.put('Wait', 'foo' ,{ttl: state['Seconds'] * 1000})
	await db.put('NextState', stateJSON.States[state.Next])
}
