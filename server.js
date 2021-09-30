"use-strict"

const low = require("lowdb"),
ft = require('fastify')(),
FileSync = require('lowdb/adapters/FileSync'),
adapter = new FileSync('data.json'),
db = low(adapter),
steno = require("steno")

db.defaults({ users: [] }).write()
db.read()

ft.register(require("fastify-cookie"))
ft.register(require("fastify-csrf"))

ft.register(require("fastify-compress"), {global: true})
ft.register(require("fastify-bcrypt"), {saltWorkFactor: 12})

ft.route({
	method: "POST",
	url: "/signin",
	onRequest: ft.csrfProtection,
	handler: async (request, reply) => {
		const {name, email, password} = request.body,
		hash = await ft.bcrypt.hash(password)
		db.get("users").value().push({name, email, hash}).write()

		return reply.code(200)
	}
})

ft.route({
	method: "POST",
	url: "/login",
	onRequest: ft.csrfProtection,
	handler: async (request, reply) => {
		const {body: {email, password}} = request
		const finalUser = db.get("users").find({ email }).value()
		const isHashed = await ft.bcrypt.compare(password, finalUser.hash)

		isHashed && reply.code(200).compress(finalUser)
	}
})

ft.route({
	method: "GET",
	url: "/teacher",
	onRequest: ft.csrfProtection, 
	handler: (request, reply) => reply.code(200).compress(db.get("users").value())
})

ft.route({
	method: "POST",
	url: "/teacher",
	onRequest: ft.csrfProtection,
	handler: (request, reply) => {
        const { body: {name, id, trainning} } = request
        const user = db.get("users").filter({ name }).value()

        db.set(`users[${id}].trainning`, trainning).value()
        db.write()

        return reply.code(200)
	}
})

ft.listen(process.env.PORT, "0.0.0.0")