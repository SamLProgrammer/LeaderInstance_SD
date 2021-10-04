const axios = require('axios')
const { exec, spawn } = require('child_process');
let nodes_ip_list = require('../data/connections')
const PATH = process.cwd();
let leader_ip;
let connections_list = [];
let leader_flag = false;
let ping_lapse;
let leader_up = false;
let io;
let my_code;

const newJoin = (req, res) => {
    connections_list.push({ ip: req.query.ip, leader: false })
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
        const local_ip = data.toString();
        const local_ip_array = local_ip.split(".");
        my_code = local_ip_array[local_ip_array.length - 1];
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

function pingToLeader() {
    setInterval(() => {
        if (leader_up) {
            const ls = spawn('bash', ['./scripts/pinger.sh', '' + leader_ip]);
            ls.stdout.on('data', (data) => {
                console.log('ping leader result: ' + data.toString())
                if (data.toString() != 200) {
                    leader_up = false;
                    notifyNodesGoneLeader(showList);
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
    let resp_counter = 0;
    let list = [];
    for (let i = 0; i < connections_list.length; i++) {
        if (connections_list[i].ip != leader_ip) {
            const ls = spawn('bash', ['./scripts/ping_stopper.sh', '' + connections_list[i].ip, '' + my_code]);
            ls.stdout.on('data', (data) => {
                console.log(' //=================== ')
                console.log('curl response : ' + data.toString())
                console.log(' ===================// ')
            });
            ls.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`);
            });
            ls.on('close', (code) => {
                console.log(`child process exited with code ${code}`);
            });
            // axios.post('http://' + connections_list[i].ip + ':5000/leaderIsGone',
            //     { code: my_code }).then(function (response) {
            //         console.log('bgger xd: ' + response.data.code)
            //         list.push({ code: response.data.code })
            //         resp_counter++;
            //         if (resp_counter == connections_list.length - 1) {
            //             showArray(list);
            //         }
            //     }).catch(err => {
            //         resp_counter++;
            //     });
        }
    }
}

function showList(list) {
    console.log('xd : ' + list.length)
    for (let i = 0; i < list.length; i++) {
        console.log(' biggers than me: ' + list[i].code)
    }
}

const stopPingingLeader = (req, res) => {
    leader_up = false;
    if (req.body.code < my_code) {
        res.send({ code: my_code }) // pilas este code es diferente al req.body.code!!
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

module.exports = {
    joinToInstances,
    getIp,
    newJoin,
    freeDockerResources,
    leaderListenPing: statusResponse,
    stopPingingLeader,
    setIO,
    turnOnSocket
}