"use-strict"

const ft = require("fastify")({logger: true})

ft.register(require("fastify-cookie"))
ft.register(require("fastify-csrf"))
ft.register(
	require('fastify-leveldb'),
	{ name: 'db' }
)

// ft.register(require("fastify-redis"), {host: "127.0.0.1"})
ft.register(require("fastify-compress"), {global: true})
ft.register(require("fastify-bcrypt"), {saltWorkFactor: 12})

ft.route({
	method: "POST",
	url: "/login",
	onRequest: ft.csrfProtection,
	handler: async (request, reply) => {

		const user = await ft.level.db.get(request.body.email),
		finalUser = JSON.parse(user),
		isUser = await ft.bcrypt.compare(request.body.password, finalUser.hash)

		isUser && reply.compress(user)
	}
})

ft.route({
	method: "POST",
	url: "/signin",
	onRequest: ft.csrfProtection,
	handler: async (request, reply) => {
		const {body: {name, email, password}} = request
		const hash = await ft.bcrypt.hash(request.body.password)
		await ft.level.db.set(email, JSON.striginfy({name, email, hash, type: "aluno"}))
		return reply.code(200)
	}
})

ft.route({
	method: "POST",
	url: "/login/teacher",
	onRequest: ft.csrfProtection,
	handler: (request, reply) => {
		return reply.send("teacher")
	}
})


ft.listen(3000, "0.0.0.0")