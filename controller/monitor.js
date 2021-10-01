const axios = require('axios')
const { exec, spawn } = require('child_process');
let nodes_ip_list = require('../data/connections')
const PATH = process.cwd();
let leader_ip;

const newJoin = (req, res) => {
    console.log(req.query.ip)
    res.send({leader : false})
}


const joinToInstances = (getIp) => {
    var fs = require('fs');
    fs.readFile('../ip_list.txt', function (err, data) {
        if (err) throw err;
        var array = data.toString().split("\n");
        for (let i = 0; i < array.length - 1; i++) {
            nodes_ip_list.push(array[i]);
        } //this works ok
        getIp();
    });
}

const getIp = () => {
    console.log('you called me, im GETIP')
    const ls = spawn('bash', ['./scripts/ip_reader.sh']);
    ls.stdout.on('data', (data) => {
        leader_ip = data.toString();
        console.log(' my ip: ' + leader_ip);
        for (let i = 0; i < nodes_ip_list.length; i++) {
            axios.get('http://' + nodes_ip_list[i] + '/query?ip=' +
                leader_ip).then(function (response) {
                    console.log(response)
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
    newJoin
}