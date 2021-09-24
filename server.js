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
	onError: error => console.error(error),
	handler: async (request, reply) => {

		if (typeof request.body !== "null") {
			const {name, email, password} = request.body,
			hash = await ft.bcrypt.hash(password)
			
			users.push({name, email, hash, type: "aluno"})
			await db.write()
			return reply.code(200)
		}

	},
	errorHandler: (err, request, reply) => {
		console.error(err)
		return reply.code(500)
	}
})

ft.route({
	method: "POST",
	url: "/login",
	onRequest: ft.csrfProtection,
	handler: async (request, reply) => {
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
	handler: (request, reply) => reply.code(200).compress(users)
})

ft.listen(process.env.PORT, "0.0.0.0")
