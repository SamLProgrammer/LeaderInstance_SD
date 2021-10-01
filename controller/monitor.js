const axios = require('axios')
const { exec } = require('child_process');
const PATH = process.cwd();

const joinToInstances = () => {
    console.log('yep I got called')
    var fs = require('fs');
    fs.readFile('../ip_list.txt', function (err, data) {
        if (err) throw err;
        var array = data.toString().split("\n");
        for (i in array) {
            console.log(array[i]);
        }
    });
}

module.exports = {
    joinToInstances
}