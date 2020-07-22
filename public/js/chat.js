const socket = io()

// Elements
const $messageForm = document.querySelector('.message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('.send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true})

const autoScroll = () => {
	// new message element
	const $newMessage = $messages.lastElementChild

	// height of the last message
	const newMessageStyle = getComputedStyle($newMessage)
	const newMessageMargin = parseInt(newMessageStyle.marginBottom)
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

	//Visible height
	 const visibleHeight = $messages.offsetHeight

	//  Heightt of messages container
	const containerHeight =$messages.scrollHeight

	// how far have i scrolled 
	const scrollOfset = $messages.scrollTop + visibleHeight

	if (containerHeight - newMessageHeight <= scrollOfset) {
		$messages.scrollTop = $messages.scrollHeight
	}
}

socket.on('message', (message) => {
	console.log(message)
	const html = Mustache.render(messageTemplate, {
		username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format('h:mm a')
	})
	$messages.insertAdjacentHTML('beforeend', html)
	autoScroll()
})

socket.on('location', (message) => {
	console.log(message)
	const html = Mustache.render(locationTemplate, {
		username: message.username,
		url: message.url,
		createdAt: moment(message.createdAt).format('h:mm a')

	})
	$messages.insertAdjacentHTML('beforeend', html)
	autoScroll()
})

socket.on('roomData', ({ room, users }) => {
	const html = Mustache.render(sidebarTemplate, { room, users })

	document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (event) => {
	event.preventDefault()
	
	$messageFormButton.setAttribute('disabled', 'disabled')
	// disable

	const message = event.target.elements.message.value

	socket.emit('sendMessage', message, (error) => {
		$messageFormButton.removeAttribute('disabled')
		$messageFormInput.value = ''
		$messageFormInput.focus()
		// enable
		if (error) {
			return console.log(error);
		}
		console.log('The message was delivered');
	})
})

$sendLocationButton.addEventListener('click', (event) => {
	if (!navigator.geolocation) {
		return alert('Geolocation is not suported by ur browser')
	}
	$sendLocationButton.setAttribute('disabled', 'disabled')

	navigator.geolocation.getCurrentPosition((position) => {
		socket.emit('sendGeolocation', {
			longitude: position.coords.longitude,
			latitude: position.coords.latitude
		}, () => {
			$sendLocationButton.removeAttribute('disabled')
			console.log('Location has been shared')
		})
	})
})

socket.emit('join', { username, room}, (error) => {
	if (error) {
		alert(error)
		location.href = '/'
	}
})
