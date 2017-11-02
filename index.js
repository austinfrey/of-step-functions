const OpenFaaS = require('openfaas')
const level = require('level')
const ttl = require('level-ttl')
const hooks = require('level-hooks')

const stateJSON = require('./state.json')
const {task, wait} = require('./step-functions')

//const heartbeat = setInterval(() => console.log('heartbeat'), 1000)
require('net').createServer().listen();

const openfaas = OpenFaaS('http://localhost:8080') // TODO should pull form ENV?
const db = ttl(level('./db', {valueEncoding: 'json'}), {checkFrequency: 50})

hooks(db)

db.hooks.post('!ttl!Wait', async(change) => {
	if(change.type === 'del') {
		try {
			const state = await db.get('NextState')
			const data = await db.get('NextData')
			await triggerFunction(state, data, false)
		} catch(err) {
			console.log(err)
		}
	}
})

runStepFunction()
	.catch(console.log)

async function runStepFunction() {
	const startAt = stateJSON['StartAt']
	const firstState = stateJSON['States'][startAt]
	await triggerFunction(firstState)
}

async function triggerFunction(state, data, isDone) {
	if(isDone) {
//		clearInterval(heartbeat)
		return console.log(data)
	}

	await chooseStateType(state, data, db, advanceState)
}

async function chooseStateType(state, data, db, advance) {
	const type = {
		  'Task': task
		, 'Wait': wait
	}

	return await type[state.Type](state, data, db, advance)
}

async function advanceState(state) {
	const nextState = state['Next']
	const isDone = state['Next']
		? false
		: true
	const data = await db.get('NextData')
	await triggerFunction(stateJSON.States[nextState], data, isDone)
}

