const axios = require('axios')
const { exec, spawn } = require('child_process');
let nodes_ip_list = require('../data/connections')
const PATH = process.cwd();
let leader_ip;
let connections_list = [];
let superior_connections_list = [];
let leader_flag = false;
let ping_lapse;
let leader_up = false;
let io;
let my_code;
let first_to_notice;
let local_ip;

const newJoin = (req, res) => {
    const connection_obj = { ip: req.query.ip, leader: false };
    connections_list.push(connection_obj)
    if (getCodeFromAddress(req.query.ip) > my_code) {
        superior_connections_list.push(connection_obj)
    }
    res.send({ leader: leader_flag })
}

const freeDockerResources = () => {
    const obj = { msg: 'free' };
    axios.post('http://192.168.56.1:8000/freeDockerResources',
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
        if (array.length == 1) { // danger
            leader_flag = true;
        } else {
            for (let i = 0; i < array.length - 1; i++) {
                nodes_ip_list.push(array[i]);
            }
        }
        getIp();
    });
}

const getIp = () => {
    const ls = spawn('bash', ['./scripts/ip_reader.sh']);
    ls.stdout.on('data', (data) => {
        local_ip = data.toString();
        const local_ip_array = local_ip.split(".");
        my_code = local_ip_array[local_ip_array.length - 1].trim();
        console.log('my code: ' + my_code)
        for (let i = 0; i < nodes_ip_list.length; i++) {
            axios.get('http://' + nodes_ip_list[i] + ':5000/newJoin?ip=' +
                local_ip).then(function (response) {
                    const object = { ip: nodes_ip_list[i], leader: response.data.leader }
                    connections_list.push(object);
                    if (object.leader) {
                        leader_up = true;
                        leader_ip = object.ip;
                        ping_lapse = getRandomInt(2, 10);
                        pingToLeader();
                        console.log('I will ping :' + leader_ip + 'every: ' + ping_lapse + ' seconds')
                    }
                }).catch(err => {
                    console.log('errxd')
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

function pingToLeader() {
    setInterval(() => {
        if (leader_up) {
            const ls = spawn('bash', ['./scripts/pinger.sh', '' + leader_ip]);
            ls.stdout.on('data', (data) => {
                console.log('ping leader result: ' + data.toString())
                if (data.toString() != 200) {
                    leader_up = false;
                    first_to_notice = true;
                    notifyNodesGoneLeader(biggerCodeDefiner);
                }
            });
            ls.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`);
            });
            ls.on('close', (code) => {
                console.log(`child process exited with code ${code}`);
            });
        }
    }, ping_lapse * 1000);
}

const notifyNodesGoneLeader = (showArray) => {
    if (first_to_notice) {
        let resp_counter = 0;
        let list = [];
        for (let i = 0; i < connections_list.length; i++) {
            if (connections_list[i].ip != leader_ip) {
                console.log('asking to : ' + connections_list[i].ip + ' to stop')
                let ls = spawn('bash', ['./scripts/ping_stopper.sh', '' + connections_list[i].ip, '' + my_code]);
                ls.stdout.on('data', (data) => {
                    resp_counter++;
                    const json_data = JSON.parse(data.toString())
                    console.log('json parsed ' + json_data)
                    if (json_data.code != 0) {
                        list.push({ code: json_data.code, ip: json_data.ip })
                    }
                    if (resp_counter == connections_list.length - 1) {
                        transferSelector(biggerCodeDefiner(list));
                    }
                });
            }
        }
    }
}

function transferSelector(in_ip) {
    axios.get('http://' + in_ip.ip.trim() + ':5000/selectorTransfer')
    // .then(function (response) {
    //     console.log(response.data)
    // }).catch(err => {
    //     console.log(err)
    // });
}

const showConnections = () => {
    console.log('//================== connections ====================')
    for (let i = 0; i < connections_list.length; i++) {
        console.log(connections_list[i].ip);
    }
    console.log('================== connections ====================//')
}

function biggerCodeDefiner(list) {
    let ip;
    let code = 0;
    for (let i = 0; i < list.length; i++) {
        if (code < list[i].code) {
            code = list[i].code;
            ip = list[i].ip;
        }
    }
    return { ip: ip };
}

const stopPingingLeader = (req, res) => {
    leader_up = false;
    first_to_notice = false;
    showConnections();
    removeConnection(leader_ip);
    showConnections();
    console.log('a ver ' + req.body.code + ' ? mine ' + my_code)
    if (req.body.code < my_code) {
        res.send({ code: my_code, ip: local_ip }) // pilas este code es diferente al req.body.code!!
    } else {
        res.send({ code: 0, ip: local_ip })
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

const statusResponse = (req, res) => {
    res.sendStatus(200);
}

const setIO = (in_io) => {
    io = in_io;
}

const removeConnection = (ip_address) => {
    let index1 = 0;
    let index2 = 0;
    for (let i = 0; i < connections_list.length; i++) {
        if (connections_list[i].ip == ip_address) {
            index1 = i;
        }
    }
    connections_list.splice(index1, 1);
    for (let i = 0; i < superior_connections_list.length; i++) {
        if (superior_connections_list[i].ip == ip_address) {
            index2 = i;
        }
    }
    superior_connections_list.splice(index2, 1);
}

const ecoSelector = (req, res) => {
    if (superior_connections_list.length > 0) {
        for (let i = 0; i < superior_connections_list.length; i++) {
            axios.post('http://' + superior_connections_list[i].ip + ':5000/ecoSelector',
                { code: my_code });
        }
    } else {
        takeTheLead();
    }
}

function takeTheLead() {
    leader_flag = true;
    for (let i = 0; i < connections_list.length; i++) {
        axios.post('http://' + connections_list[i].ip + ':5000/newLeader',
            { ip: local_ip }).then(function (response) {
                console.log(response.data)
            }).catch(err => {
                console.log(err)
            });
    }
}

function getCodeFromAddress(ip_address) {
    const array = ip_address.split('.');
    return array[array.length - 1].trim();
}

const turnOnSocket = () => {
    io.on('connection', socket => {
        socket.on('kill_me_babe', () => {
            console.log('nooo why D:')
            axios.post('http://192.168.56.1:8000/kill',
                { code: my_code }).then(function (response) {
                    console.log(response.data)
                }).catch(err => {
                    console.log(err)
                });
        })
    })
}

const newLeaderStablishment = (req, res) => {
    leader_ip = req.body.ip;
    for(let i = 0; i < connections_list.length; i++) {
        if(connections_list[i].ip == leader_ip) {
            connections_list[i].leader = true;
            console.log('new Leader received: ' + connections_list[i].ip)
        }
    }
    for(let i = 0; i < superior_connections_list.length; i++) {
        if(superior_connections_list[i].ip == leader_ip) {
            superior_connections_list[i].leader = true;
        }
    }
    leader_up = true;
}

module.exports = {
    joinToInstances,
    getIp,
    newJoin,
    freeDockerResources,
    leaderListenPing: statusResponse,
    stopPingingLeader,
    setIO,
    turnOnSocket,
    ecoSelector,
    newLeaderStablishment
}