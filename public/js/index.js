const { io } = require("../../server/sockets/sockets");

window.onload = () => {
    const kill_button = document.getElementById('kill_instance_button');
    kill_button.addEventListener('click', function (event) { killInstance(event, kill_button) });
}

const socket = io();

socket.on('free', (arg) => { 
	new_instance_button.style.display = 'block';
});

function killInstance(event, kill_button) {
    alert('xd')
    socket.emit('kill_me_babe');
}