const instance = require('axios')
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
let on_dispute = false;

const axios = instance.create();
let axios2;
axiosInstance();

function axiosInstance () {
    const axiosInstance = instance.create();
    axiosInstance.defaults.timeout = 3000;
    axios2 = axiosInstance;
}


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
        local_ip = data.toString().trim();
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
                        ping_lapse = getRandomInt(1, 3);
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
        if (!leader_flag &&  leader_up) {
            axios2.get('http://' + leader_ip + ':5000/status')
            .then(function (response) {
                console.log(response.status)
                }).catch(function (err) {
                        console.log(err.status);
                        leader_up = false;
                        disputeFirst();
                });
        }
    }, ping_lapse * 1000);
}

const notifyNodesGoneLeader = (showArray) => {
    let resp_counter = 0;
    let list = [];
    for (let i = 0; i < connections_list.length; i++) {
        if (connections_list[i].ip != leader_ip) {
            axios.post('http://' + connections_list[i].ip + ':5000/leaderIsGone',
                { code: my_code, ip: leader_ip }).then(function (response) {
                    console.log('response data : ' + JSON.stringify(response.data))
                    resp_counter++;
                    if (response.data.code != 0) {
                        list.push({ code: response.data.code, ip: '' + response.data.ip })
                    }
                    if (resp_counter == connections_list.length - 1) {
                        if (list.length > 0) {
                            transferSelector(biggerCodeDefiner(list));
                        } else {
                            takeTheLead();
                        }
                    }
                }).catch(err => {
                    console.log(err)
                });
        }
    }
}

function transferSelector(in_ip) {
    axios.get('http://' + in_ip.ip + ':5000/selectorTransfer')
}

const showConnections = () => {
    console.log('//================== connections ====================')
    for (let i = 0; i < connections_list.length; i++) {
        console.log(connections_list[i].ip);
    }
    console.log('================== connections ====================//')
}

function biggerCodeDefiner(list) {
    let aux_ip;
    let code = 0;
    for (let i = 0; i < list.length; i++) {
        if (code < list[i].code) {
            code = list[i].code;
            aux_ip = list[i].ip;
        }
    }
    const ip = aux_ip.trim();
    return { ip: ip };
}

const stopPingingLeader = (req, res) => {
    console.log('comming from: ' + req.body.code + ' ' + req.body.ip + ' actual leader ' + leader_ip)
    if (req.body.ip == leader_ip) {
        first_to_notice = false;
        leader_up = false;
        if (req.body.code < my_code) {
            res.send({ code: my_code, ip: local_ip }) // pilas este code es diferente al req.body.code!!
        } else {
            res.send({ code: 0, ip: local_ip })
        }
    }
    on_dispute = false;
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
    let flag1 = false;
    let flag2 = false;
    for (let i = 0; i < connections_list.length; i++) {
        if (connections_list[i].ip == ip_address) {
            index1 = i;
            flag1 = true;
        }
    }
    if (flag1) {
        connections_list.splice(index1, 1);
    }
    for (let i = 0; i < superior_connections_list.length; i++) {
        if (superior_connections_list[i].ip == ip_address) {
            index2 = i;
            flag2 = true;
        }
    }
    if (flag2) {
        superior_connections_list.splice(index2, 1);
    }
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
    console.log('I took the Lead')
    leader_flag = true;
    removeConnection(leader_ip);
    leader_ip = local_ip;
    for (let i = 0; i < connections_list.length; i++) {
        axios.post('http://' + connections_list[i].ip + ':5000/newLeader',
            { ip: '' + local_ip })
    }
    axiosInstance();
}

function getCodeFromAddress(ip_address) {
    const array = ip_address.split('.');
    return array[array.length - 1].trim();
}

const turnOnSocket = () => {
    io.on('connection', socket => {
        socket.on('kill_me_babe', () => {
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
    showConnections();
    removeConnection(leader_ip);
    showConnections();
    leader_ip = req.body.ip.trim();
    for (let i = 0; i < connections_list.length; i++) {
        if (connections_list[i].ip == leader_ip) {
            connections_list[i].leader = true;
            console.log('new Leader received: ' + connections_list[i].ip)
        }
    }
    for (let i = 0; i < superior_connections_list.length; i++) {
        if (superior_connections_list[i].ip == leader_ip) {
            superior_connections_list[i].leader = true;
        }
    }
    leader_up = true;
    axiosInstance();
}

function disputeFirst() {
    on_dispute = true;
    console.log('TO DISPUTE IT')
    axios.post('http://192.168.56.1:8000/disputeFirst', {code: my_code, fallen: leader_ip})
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
    newLeaderStablishment,
    notifyNodesGoneLeader
}