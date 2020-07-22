const path = require('path');
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const {	addUser,	removeUser,	getUsersInRoom,	getUser} = require('./utils/users')
const app = express()
const server = http.createServer(app);
const io = socketio(server);
const Filter = require('bad-words')

const PORT = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
console.log('New socket connection');

	socket.on('join', ({username, room}, callback) => {
		const {error, user} = addUser({ id:socket.id, username, room});

		if (error) {
			return callback(error);
		}
		socket.join(user.room)

		socket.emit('message', generateMessage('Admin','Welcome'))
		socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined`))
		io.to(user.room).emit('roomData', {
			room: user.room,
			users: getUsersInRoom(user.room)
		})
		callback()
	})



	socket.on('sendMessage', (message, callback) => {
		const filter = new Filter()

		const user = getUser(socket.id)

		if (filter.isProfane(message)) {
			return callback('Profanity is not allowed')
		}

		io.to(user.room).emit('message', generateMessage(user.username,message))
		callback()
	})

	socket.on('sendGeolocation', (coords, callback) => {
		const user = getUser(socket.id)
		io.to(user.room).emit('location', generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
		callback()
	})


	socket.on('disconnect', () => {
		const user = removeUser(socket.id)

		if (user) {
			io.to(user.room).emit('message', generateMessage('Admin',`${user.username} has left`))
			io.to(user.room).emit('roomData', {
				room: user.room,
				users: getUsersInRoom(user.room)
			})
		}

		
	})
})

server.listen(PORT, () => {
	console.log(`Server is up on port 3000`);
})