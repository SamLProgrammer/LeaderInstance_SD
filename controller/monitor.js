const axios = require('axios')
const { exec } = require('child_process');
let { nodes_ip_list } = require('../data/connections')
const PATH = process.cwd();

const joinToInstances = () => {
    var fs = require('fs');
    fs.readFile('../ip_list.txt', function (err, data) {
        if (err) throw err;
        var array = data.toString().split("\n");
        for (i in array) {
            nodes_ip_list.push(array[i]);
        }
        for( i in nodes_ip_list) {
            console.log(nodes_ip_list[i]);
        }
        console.log('===========')
    });
}

module.exports = {
    joinToInstances
}