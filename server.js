"use-strict"

const low = require("lowdb"),
ft = require('fastify')(),
http = require('http'),
server = http.createServer(ft),
{ Server } = require("socket.io"),
io = new Server(server),
FileSync = require('lowdb/adapters/FileSync'),
adapter = new FileSync('data.json'),
db = low(adapter)

db.defaults({ users: [] }).write()

ft.register(require("fastify-cookie"))
ft.register(require("fastify-csrf"))
ft.register(require("fastify-cors"), {origin: "*"})

ft.register(require("fastify-compress"), {global: true})
ft.register(require("fastify-bcrypt"), {saltWorkFactor: 12})

ft.route({
	method: "POST",
	url: "/signin",
	onRequest: ft.csrfProtection,
	handler: async (request, reply) => {

		const {name, email, password} = request.body,
		hash = await ft.bcrypt.hash(password)
			
		db.get("users").push({name, email, hash, type: "aluno"}).write()
		return reply.code(200)

	}
})

ft.route({
	method: "POST",
	url: "/login",
	onRequest: ft.csrfProtection,
	handler: async (request, reply) => {
		const users = db.get("users").value()
		const {body: {email, password}} = request
		const finalUser = users.find(el => el.email === email)
		typeof finalUser === "undefined" && reply.code(403).send("Email Incorreto/Não Cadastrado.")
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

ft.listen(process.env.PORT, "0.0.0.0")
// server.listen(3000, console.log('listening on *:3000'))