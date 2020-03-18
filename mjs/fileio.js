const fs = require('fs');
const path = require('path');
const app = require('electron').app;

class FileIO {
    constructor() {
        this.path = app.getPath('userData') + path.normalize('/Data/');

        this.dataPath = this.path + 'table.json';

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
            let table = [];
            for (let rowIndex = 0; rowIndex < 17; rowIndex++) {
                let row = [];
                for (let cellIndex = 0; cellIndex < 7; cellIndex++) {
                    row.push('Homework');
                }
                table.push(row);
            }
            this.writeData(JSON.stringify(table), this.dataPath);
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
