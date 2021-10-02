const axios = require('axios');
const { exec, spawn } = require('child_process');
let nodes_ip_list = require('../data/connections');
const PATH = process.cwd();
let leader_ip;
let connections_list = [];
let leader_flag = false;
let myIntervalTime = randomTimeInterval();

pingToLeader();

const newJoin = (req, res) => {
	connections_list.push({ ip: req.query.ip, leader: false });
	res.send({ leader: leader_flag });
};

const status = (req, res) => {
	res.sendStatus(200);
};

const stopPing = (req, res) => {
	clearInterval(pingToLeader);
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
	if (!leader_flag) {
		const responseStatutsLead = spawn('bash', [`/scripts/ping.sh ${leader_ip}`]);
		responseStatutsLead.stdout.on('data', (data) => {
			if (data !== 200) {
				stopPingToLead();
			}
		});
		responseStatutsLead.stderr.on('data', (data) => {
			console.error(`stderr: ${data}`);
		});
		responseStatutsLead.on('close', (code) => {
			console.log(`child process exited with code ${code}`);
		});
		// exec(PATH + `/scripts/ping.sh ${leader_ip}`, (err, stdout, stderr) => {
		// 	if (err) {
		// 		console.error(err);
		// 		return;
		// 	}
		// 	console.log(stdout);
		// 	//falta if que cuando no responda el lider le envia a todas las instancias la orden de que paren
		// 	stopPingToLead();
		// });
	}
}, myIntervalTime);

const stopPingToLead = () => {
	for (let i = 0; i < nodes_ip_list.length; i++) {
		axios
			.get('http://' + nodes_ip_list[i] + ':5000/stopPing')
			.then(function (response) {
				const object = { ip: nodes_ip_list[i], leader: response.data.leader };
				connections_list.push(object);
				if (object.leader) {
					leader_ip = object.ip;
					console.log('leader : ' + leader_ip);
				}
			})
			.catch((err) => {
				console.log('err');
			});
	}
};

const randomTimeInterval = () => {
	return Math.floor(2000 + Math.random() * 15000);
};

module.exports = {
	joinToInstances,
	getIp,
	newJoin,
	freeDockerResources,
	stopPing,
	status,
};
