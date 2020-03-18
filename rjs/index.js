const headers = ['TIME', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const tableElement = document.querySelector('#timetable');

let timetable = getData();

let currentCell;
let hoveredCell;

function clearElement(elem) {
    while (elem.firstNode) {
        elem.removeChild(elem.firstNode);
    }
}

function renderTable(timetable) {
    clearElement(tableElement);

    let headerRowElement = document.createElement('TR');
    headerRowElement.classList.add('header-row');
    [...headers, ''].forEach(header => {
        let headerElement = document.createElement('TH');
        headerElement.classList.add('header');

        let headerText = document.createTextNode(header);

        headerElement.appendChild(headerText);
        headerRowElement.appendChild(headerElement);
    });
    tableElement.appendChild(headerRowElement);

    for (let rowIndex = 0; rowIndex < timetable.length; rowIndex++) {
        let rowElement = document.createElement('TR');

        for (let cellIndex = 0; cellIndex < timetable[0].length + 2; cellIndex++) {
            let cellElement = document.createElement('TD');

            let cellClass, cellText;
            if (cellIndex === 0) {
                cellClass = 'time';
                cellText = `${(rowIndex + 7).toString().padStart(2, '0')}:00`;
            } else if (cellIndex === timetable[0].length + 1) {
                cellClass = 'row-index';
                cellText = rowIndex;
                cellElement.setAttribute('id', `row-${rowIndex}`);
            } else {
                cellClass = 'cell';
                cellText = timetable[rowIndex][cellIndex - 1];
                cellElement.setAttribute('id', `c-${rowIndex}-${cellIndex - 1}`);

                cellElement.addEventListener('mouseenter', e => {
                    const [rowIndex, cellIndex] = e.currentTarget.getAttribute('id').split('-').slice(1);

                    if (hoveredCell && hoveredCell.length) {
                        document.querySelector(`#row-${hoveredCell[0]}`).classList.remove('active-index');
                        document.querySelector(`#cell-${hoveredCell[1]}`).classList.remove('active-index');
                    }

                    if (!currentCell || rowIndex !== currentCell[0] && cellIndex !== currentCell[1]) {
                        hoveredCell = [rowIndex, cellIndex];
                        document.querySelector(`#row-${hoveredCell[0]}`).classList.add('active-index');
                        document.querySelector(`#cell-${hoveredCell[1]}`).classList.add('active-index');
                    }
                }, false);
                cellElement.addEventListener('mouseleave', e => {
                    const [rowIndex, cellIndex] = e.currentTarget.getAttribute('id').split('-').slice(1);

                    if (hoveredCell && hoveredCell.length && hoveredCell[0] === rowIndex && hoveredCell[1] === cellIndex) {
                        document.querySelector(`#row-${rowIndex}`).classList.remove('active-index');
                        document.querySelector(`#cell-${cellIndex}`).classList.remove('active-index');
                    }
                }, false);
                cellElement.addEventListener('click', e => {
                    const [rowIndex, cellIndex] = e.currentTarget.getAttribute('id').split('-').slice(1);

                    if (currentCell && currentCell.length) {
                        document.querySelector(`#row-${currentCell[0]}`).classList.remove('active-index');
                        document.querySelector(`#cell-${currentCell[1]}`).classList.remove('active-index');
                        document.querySelector(`#c-${currentCell[0]}-${currentCell[1]}`).classList.remove('active-cell');
                    }
                    currentCell = [rowIndex, cellIndex];
                    hoveredCell = [];

                    document.querySelector(`#row-${currentCell[0]}`).classList.add('active-index');
                    document.querySelector(`#cell-${currentCell[1]}`).classList.add('active-index');

                    e.currentTarget.classList.add('active-cell');
                }, false);
            }

            cellElement.classList.add(cellClass);
            let cellTextElement = document.createTextNode(cellText);

            cellElement.appendChild(cellTextElement);
            rowElement.appendChild(cellElement);
        }
        tableElement.appendChild(rowElement);
    }

    let indexRowElement = document.createElement('TR');
    indexRowElement.classList.add('index-row');
    for (let cellIndex = 0; cellIndex < timetable[0].length + 2; cellIndex++) {
        let cellElement = document.createElement('TD');
        if (cellIndex !== 0 && cellIndex !== timetable[0].length + 1) {
            cellElement.classList.add('cell-index');
            cellElement.setAttribute('id', `cell-${cellIndex - 1}`);

            let cellText = document.createTextNode(cellIndex - 1);
            cellElement.appendChild(cellText);
        }
        indexRowElement.appendChild(cellElement);
    }
    tableElement.appendChild(indexRowElement);
}

function clearSelection() {
    if (currentCell && currentCell.length) {
        document.querySelector(`#row-${currentCell[0]}`).classList.remove('active-index');
        document.querySelector(`#cell-${currentCell[1]}`).classList.remove('active-index');
        document.querySelector(`#c-${currentCell[0]}-${currentCell[1]}`).classList.remove('active-cell');

        currentCell = [];
    }
}

window.addEventListener('keyup', e => {
    switch (e.key) {
        case 'Escape':
            clearSelection();
            break;
        default:
            console.log(e.key);
    }
}, false);

renderTable(timetable);