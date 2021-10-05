window.onload = () => {
    const kill_button = document.getElementById('kill_instance_button');
    kill_button.addEventListener('click', function (event) { killInstance(event, kill_button) });
}

const socket = io();
var tableBodyElement = document.getElementById('table-body');
var leader = document.getElementById('leader');

//este es el metodo que escucha cuando llega una nueva instancia llega un objeto

socket.on("newInstance", (info) => {
    let cell = '<tr><th scope="row">' + info.number + '</th><td>' + info.ip + '</td><td>' + info.port + '</td><td>' + "otra info" + '</td></tr>';
	let row = document.createElement('TR');
	row.innerHTML = cell;
	tableBodyElement.appendChild(row);
});

//este metodo actualiza quien es el lider como dato
socket.on('newleader', (leader)=>{
    leader.innerHTML = leader;
});

socket.on('free', (arg) => { 
	new_instance_button.style.display = 'block';
});

function killInstance(event, kill_button) {
    socket.emit('kill_me_babe');
}