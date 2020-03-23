const fs = require('fs');
const path = require('path');
const app = require('electron').app;

class FileIO {
    constructor() {
        this.path = app.getPath('userData') + path.normalize('/Data/');

        this.dataPath = this.path + 'table.json';
        this.defaultPath = this.path + 'default.json';

        this.dataSet = false;
        if (
            fs.existsSync(this.path) &&
            fs.existsSync(this.dataPath)
        ) {
            this.dataSet = true;
        }
    }

    pathExists(path) {
        return fs.existsSync(path);
    }

    setup() {
        if (!this.pathExists(this.dataPath)) {
            if (!this.pathExists(this.path)) {
                if (!this.pathExists(app.getPath('userData'))) {
                    fs.mkdirSync(app.getPath('userData'));
                }
                fs.mkdirSync(this.path);
            }

            if (!this.pathExists(this.defaultPath)) {
                let table = [];
                for (let rowIndex = 0; rowIndex < 17; rowIndex++) {
                    let row = [];
                    for (let cellIndex = 0; cellIndex < 7; cellIndex++) {
                        row.push('');
                    }
                    table.push(row);
                }
                this.writeData(JSON.stringify({timestamp: new Date().toDateString(), timetable: table}), this.dataPath);
            } else {
                this.writeData(JSON.stringify({
                    timestamp: new Date().toDateString(),
                    timetable: JSON.parse(this.readData(this.defaultPath))
                }), this.dataPath);
            }
        } else {
            const data = JSON.parse(this.readData(this.dataPath));
            let then = new Date(data.timestamp);
            let now = new Date();

            then.setDate(then.getDate() - then.getDay());
            now.setDate(now.getDate() - now.getDay());

            const weeks = (now.getTime() - then.getTime()) / 1000 / 60 / 60 / 24 / 7 | 0;
            if (weeks) {
                this.writeData(JSON.stringify({
                    timestamp: new Date().toDateString(),
                    timetable: JSON.parse(this.readData(this.defaultPath))
                }), this.dataPath);
            }
        }
    }

    writeData(data, path) {
        fs.writeFile(path, data, err => {
            if (err) return 1;
        });
        return 0;
    }

    readData(path) {
        let data;
        try {
            data = fs.readFileSync(path);
        } catch (_) {
            data = '{}';
        }
        return data;
    }
}

module.exports = FileIO;
