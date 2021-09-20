"use-strict"

import fastify from 'fastify'
import { Low, JSONFile } from 'lowdb'

const jsonData = new JSONFile("./data.json")
const db = new Low(jsonData)
const ft = fastify()

db.read()
db.data = db.data || { users: [] }

ft.register(await import("fastify-cookie"))
ft.register(await import("fastify-csrf"))

ft.register(await import("fastify-compress"), {global: true})
ft.register(await import("fastify-bcrypt"), {saltWorkFactor: 12})

ft.route({
	method: "POST",
	url: "/signin",
	onRequest: ft.csrfProtection,
	handler: async (request, reply) => {
		const {body: {name, email, password}} = request,
		hash = await ft.bcrypt.hash(password)
		db.data.users.push({name, email, hash, type: "aluno"})
        await db.write()
		return reply.code(200)
	}
})

ft.route({
	method: "POST",
	url: "/login",
	onRequest: ft.csrfProtection,
	handler: async (request, reply) => { 
        const finalUser = db.data.users.find( el => el.email === request.body.email  )
        const isHashed = await ft.bcrypt.compare(request.body.password, finalUser.hash)
          
        isHashed && reply.code(200).compress(finalUser)
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

ft.listen(3000 || process.env.PORT)