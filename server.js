"use-strict"

const low = require("lowdb"),
ft = require('fastify')(),
FileSync = require('lowdb/adapters/FileSync'),
adapter = new FileSync('data.json'),
db = low(adapter),
jwt = require("jsonwebtoken"),
auth = require("./config/auth.json")

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
		db.get("users").value().push({name, email, hash, trainning: {}})
		db.write()

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
		typeof finalUser === "undefined" && reply.code(403).send({ error: "User not find" }) 
		const isHashed = await ft.bcrypt.compare(password, finalUser.hash)
		if (isHashed) {
           const token = jwtToken = jwt.sign({ id: finalUser.hash }, auth.secret, {expiresIn: 86400})
		   return reply.code(200).compress({token, finalUser})
		} 
		return reply.code(403).send({ error: "password is invalid" })
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
        Object.keys(trainning).forEach( el => {
        	 const isntNull = trainning[el][0].length
        	 if (isntNull > 0) {
                db.set("users[" + id +"].trainning[" + el + "]", trainning[el]).value()
                db.write()
        	 }
        })
        return reply.code(200)
	}
})

ft.listen(process.env.PORT || 3000, "0.0.0.0")