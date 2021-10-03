const axios = require('axios');
const { exec, spawn } = require('child_process');
let nodes_ip_list = require('../data/connections');
const PATH = process.cwd();
let leader_ip;
let connections_list = [];
let leader_flag = false;
let myIntervalTime = randomTimeInterval();
let leadAlive = false;
let idListForNewLead = [];
const myIP = getLocalIP();

pingToLeader();

const newJoin = (req, res) => {
	connections_list.push({ ip: req.query.ip, leader: false });
	res.send({ leader: leader_flag });
};

const status = (req, res) => {
	res.sendStatus(200);
};

const stopPing = (req, res) => {
	leadAlive = false;
	let id = req.data.id;
	let myId = myIP.split('.'[3]);
	if (myId > id) {
		res.send({ ip: myIP });
	}
};

const assignNewLead = (req, res) => {
	leader_flag = true;
	leader_ip = myIP;
	notificationToInstances();
};

const leaderChosen = (req, res) => {
	leader_ip = req.data.ip;
};

const notificationToInstances = () => {
	for (let i = 0; i < connections_list.length; i++) {
		const obj = { ip: myIP };
		axios
			.post('http://' + connections_list[i].ip + ':5000/leaderChosen', obj)
			.then(function (response) {
				console.log(response);
			})
			.catch((err) => {
				console.log('err');
			});
	}
};

const freeDockerResources = () => {
	const obj = { msg: 'free' };
	axios
		.post('http://192.168.56.1:8000/freeDockerResources', obj)
		.then(function (response) {
			console.log(response.data);
		})
		.catch((err) => {
			console.log(err);
		});
};

const joinToInstances = (getIp) => {
	var fs = require('fs');
	fs.readFile('../ip_list.txt', function (err, data) {
		if (err) throw err;
		var array = data.toString().split('\n');
		if (array.length == 1) {
			// danger
			leader_flag = true;
		} else {
			for (let i = 0; i < array.length - 1; i++) {
				nodes_ip_list.push(array[i]);
			}
		}
		getIp();
	});
};

const getIp = () => {
	const ls = spawn('bash', ['./scripts/ip_reader.sh']);
	ls.stdout.on('data', (data) => {
		const local_ip = data.toString();
		for (let i = 0; i < nodes_ip_list.length; i++) {
			axios
				.get('http://' + nodes_ip_list[i] + ':5000/newJoin?ip=' + local_ip)
				.then(function (response) {
					const object = { ip: nodes_ip_list[i], leader: response.data.leader };
					connections_list.push(object);
					if (object.leader) {
						leadAlive = true;
						leader_ip = object.ip;
						console.log('leader : ' + leader_ip);
					}
				})
				.catch((err) => {
					console.log('err');
				});
		}
	});
	ls.stderr.on('data', (data) => {
		console.error(`stderr: ${data}`);
	});
	ls.on('close', (code) => {
		console.log(`child process exited with code ${code}`);
	});
};

const pingToLeader = setInterval(() => {
	if (!leader_flag && leadAlive) {
		axios
			.get('http://' + leader_ip + ':5000/status')
			.then(function (response) {
				let result = response.data;
				if (result !== 200) {
					stopPingToLead();
				}
			})
			.catch((err) => {
				console.log('err');
			});
	}
}, myIntervalTime);

const stopPingToLead = () => {
	for (let i = 0; i < connections_list.length; i++) {
		if (connections_list[i].ip !== leader_ip) {
			let objIP = { id: myIP.split('.')[3] };
			axios
				.post('http://' + nodes_ip_list[i] + ':5000/stopPing', objIP)
				.then(function (response) {
					idListForNewLead.push(response.data.ip);
				})
				.catch((err) => {
					console.log('err');
				});
		}
	}
	chooseNewLead();
};

const nextLead = () => {
	var array = [];
	if (idListForNewLead != null) {
		for (let i = 0; i < idListForNewLead.length; i++) {
			array = idListForNewLead.split('.')[3];
		}
		let id = Math.max.apply(Math, array);
		let ipLead = '119.18.0.' + id;
		return ipLead;
	} else {
		return myIP;
	}
};

const chooseNewLead = () => {
	let ipNewLead = nextLead();
	axios
		.get('http://' + ipNewLead + ':5000/assignNewLead')
		.then(function (response) {})
		.catch((err) => {
			console.log('err');
		});
};

const randomTimeInterval = () => {
	return Math.floor(2000 + Math.random() * 15000);
};

const getLocalIP = () => {
	const ls = spawn('bash', ['./scripts/ip_reader.sh']);
	ls.stdout.on('data', (data) => {
		return data.toString();
	});
	ls.stderr.on('data', (data) => {
		console.error(`stderr: ${data}`);
	});
	ls.on('close', (code) => {
		console.log(`child process exited with code ${code}`);
	});
};

module.exports = {
	joinToInstances,
	getIp,
	newJoin,
	freeDockerResources,
	stopPing,
	status,
	assignNewLead,
	leaderChosen,
};
