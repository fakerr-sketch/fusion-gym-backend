"use-strict"

import fastify from 'fastify'
import { Low, JSONFile } from 'lowdb'

const jsonData = new JSONFile("./data.json")
const db = new Low(jsonData)
const ft = fastify()

await db.read()
db.data = db.data || { users: [] }
const {data: {users}} = db

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
		hash = await ft.bcrypt.hash(password),
		data = {name, email, hash, type: "aluno"}
	    users.push(data)
        await db.write()
		return reply.code(200)
	}
})

ft.route({
	method: "POST",
	url: "/login",
	onRequest: ft.csrfProtection,
	handler: async (request, reply) => {
		const {body: {email, password}} = request
		const finalUser = users.find(el => el.email === email)
        const isHashed = await ft.bcrypt.compare(password, finalUser.hash)
          
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

ft.listen(process.env.PORT, "0.0.0.0")