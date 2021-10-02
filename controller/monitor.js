const axios = require('axios')
const { exec, spawn } = require('child_process');
let nodes_ip_list = require('../data/connections')
const PATH = process.cwd();
let leader_ip;
let connections_list = [];
let leader_flag = false;

const newJoin = (req, res) => {
    console.log(req.query.ip)
    connections_list.push({ ip: req.query.ip, leader: false })
    res.send({ leader: leader_flag })
    for (let i = 0; i < connections_list.length; i++) {
        console.log(connections_list[i]);
    }
}

const freeDockerResources = () => {
    const obj = {msg: 'free'};
    axios.post('http://192.168.1.54:8000/freeDockerResources',
    obj).then(function (response) {
            console.log(response.data)
        }).catch(err => {
            console.log(err)
        });
}

const joinToInstances = (getIp) => {
    var fs = require('fs');
    fs.readFile('../ip_list.txt', function (err, data) {
        if (err) throw err;
        var array = data.toString().split("\n");
        for (let i = 0; i < array.length - 1; i++) {
            nodes_ip_list.push(array[i]);
        }
        getIp();
    });
}

const getIp = () => {
    const ls = spawn('bash', ['./scripts/ip_reader.sh']);
    ls.stdout.on('data', (data) => {
        const local_ip = data.toString();
        console.log(' my ip: ' + local_ip);
        for (let i = 0; i < nodes_ip_list.length; i++) {
            axios.get('http://' + nodes_ip_list[i] + ':5000/newJoin?ip=' +
                local_ip).then(function (response) {
                    console.log('I got response: ' + i)
                    const object = { ip: nodes_ip_list[i], leader: response.data.leader }
                    connections_list.push(object);
                }).catch(err => {
                    console.log('err')
                });
        }
    });
    ls.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });
    ls.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });
}

module.exports = {
    joinToInstances,
    getIp,
    newJoin,
    freeDockerResources,
}