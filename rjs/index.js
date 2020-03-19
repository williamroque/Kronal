const headers = ['TIME', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const tableElement = document.querySelector('#timetable');
const gotoPrompt = document.querySelector('#goto-prompt');

let timetable = getData();

let currentCell = [];
let hoveredCell = [];

let gotoPromptVisible = false;
let promptText;
let promptCmd;
let temporaryIndices = [];

let cursorPos;

function clearElement(elem) {
    while (elem.firstNode) {
        elem.removeChild(elem.firstNode);
    }
}

function selectIndex(row, cell) {
    if (/^\d+$/.test(row + []) && row < timetable.length) {
        document.querySelector(`#row-${row}`).classList.add('active-index');
    }
    if (/^\d+$/.test(cell + []) && cell < timetable[0].length) {
        document.querySelector(`#cell-${cell}`).classList.add('active-index');
    }
}

function clearIndex(row, cell) {
    if (/^\d+$/.test(row + []) && row < timetable.length) {
        document.querySelector(`#row-${row}`).classList.remove('active-index');
    }
    if (/^\d+$/.test(cell + []) && cell < timetable[0].length) {
        document.querySelector(`#cell-${cell}`).classList.remove('active-index');
    }
}

function selectCellIndex(row, cell) {
    if (/^\d+$/.test(row + []) && row < timetable.length && /^\d+$/.test(cell + []) && cell < timetable[0].length) {
        document.querySelector(`#c-${row}-${cell}`).classList.add('active-cell');
    }
}

function clearCellIndex(row, cell) {
    if (/^\d+$/.test(row + []) && row < timetable.length && /^\d+$/.test(cell + []) && cell < timetable[0].length) {
        document.querySelector(`#c-${row}-${cell}`).classList.remove('active-cell');
    }
}

function selectCell(row, cell) {
    if (currentCell.length) {
        clearIndex(...currentCell);
        clearCellIndex(...currentCell);
    }
    currentCell = [row, cell];
    hoveredCell = [];

    selectIndex(...currentCell);
    selectCellIndex(...currentCell);
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
                    const [rowIndex, cellIndex] = e.currentTarget.getAttribute('id').split('-').slice(1).map(x => x | 0);

                    if (hoveredCell.length) {
                        if (hoveredCell[0] !== currentCell[0]) {
                            clearIndex(hoveredCell[0], null);
                        }

                        if (hoveredCell[1] !== currentCell[1]) {
                            clearIndex(null, hoveredCell[1]);
                        }
                    }

                    if (rowIndex !== currentCell[0] && cellIndex !== currentCell[1]) {
                        hoveredCell = [rowIndex, cellIndex];
                        selectIndex(...hoveredCell, currentCell);
                    }
                }, false);
                cellElement.addEventListener('mouseleave', e => {
                    const [rowIndex, cellIndex] = e.currentTarget.getAttribute('id').split('-').slice(1).map(x => x | 0);

                    if (rowIndex !== currentCell[0]) {
                        clearIndex(rowIndex, null);
                    }

                    if (cellIndex !== currentCell[1]) {
                        clearIndex(null, cellIndex);
                    }
                }, false);
                cellElement.addEventListener('click', e => {
                    const indices = e.currentTarget.getAttribute('id').split('-').slice(1).map(x => x | 0);
                    selectCell(...indices);
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
    if (currentCell.length) {
        clearIndex(...currentCell);
        clearCellIndex(...currentCell);

        currentCell = [];
    }
}

gotoPrompt.addEventListener('focusout', () => {
    gotoPrompt.style.display = 'none';
});

function setCursor(col, elem) {
    const range = document.createRange();
    const selection = window.getSelection();
    range.setStart(elem.childNodes[0], col);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
}

const gotoSequence = [/^\/\d+$/, /^\/\d+\.$/, /^\/\d+\.\d+$/, /^\/\d+\.\d+\,$/, /^\/\d+\.\d+\,\d+$/, /^\/\d+\.\d+\,\d+\.$/, /^\/\d+\.\d+\,\d+\.\d+$/];
const swapSequence = [/^\'\d+$/, /^\'\d+\.$/, /^\'\d+\.\d+$/];
gotoPrompt.addEventListener('keydown', e => {
    e.preventDefault();
    let completed = false;

    const key = e.key;
    if (promptText.length < 18) {
        let proText = promptText.slice(0, cursorPos) + key + promptText.slice(cursorPos, gotoPrompt.length);
        if (
            promptCmd === '/' && gotoSequence.some(pattern => pattern.test(proText)) ||
            promptCmd === '\'' && swapSequence.some(pattern => pattern.test(proText))
        ) {
            promptText = proText;
            gotoPrompt.innerText = promptText;
            cursorPos++;
        }
    }

    if (key === 'Backspace') {
        if (promptText.length === 1) {
            gotoPrompt.style.display = 'none';
        } else {
            if (e.metaKey) {
                promptText = promptCmd + promptText.slice(cursorPos, promptText.length);
                gotoPrompt.innerText = promptText;
                cursorPos = 1;
            } else {
                promptText = promptText.slice(0, cursorPos - 1) + promptText.slice(cursorPos, promptText.length);
                gotoPrompt.innerText = promptText;
                cursorPos--;
            }
        }
    } else if (key === 'ArrowLeft') {
        if (e.metaKey) {
            cursorPos = 1;
        } else {
            if (cursorPos > 1) cursorPos--;
        }
    } else if (key === 'ArrowRight') {
        if (e.metaKey) {
            cursorPos = promptText.length;
        } else {
            cursorPos++;
        }
    } else if (key === 'Enter') {
        if (promptCmd === '/') {
            if (gotoSequence[2].test(promptText) || gotoSequence[6].test(promptText)) {
                const [row, cell] = promptText.slice(1).split('.').map(x => x | 0);
                if (row < timetable.length && cell < timetable[0].length) {
                    selectCell(row, cell);
                    completed = true;
                }
            }
        } else {

        }

        if (completed) {
            gotoPrompt.style.display = 'none';
        }
    }

    if (promptCmd === '/') {
        const [row, cell] = promptText.slice(1).split('.').map(x => /^\d+$/.test(x + []) ? x | 0 : undefined);

        if (/^\d+$/.test(row + [])) {
            if (temporaryIndices.length && temporaryIndices[0] < timetable.length && temporaryIndices[0] !== currentCell[0] && temporaryIndices[0] !== row && temporaryIndices[0] !== hoveredCell[0]) {
                clearIndex(temporaryIndices[0], null);
            }

            if (row < timetable.length) {
                selectIndex(row, null);
            }
        }

        if (/^\d+$/.test(cell + [])) {
            if (temporaryIndices.length && temporaryIndices[1] < timetable[0].length && temporaryIndices[1] !== currentCell[1] && temporaryIndices[1] !== cell && temporaryIndices[1] !== hoveredCell[1]) {
                clearIndex(null, temporaryIndices[1]);
            }

            if (cell < timetable[0].length) {
                selectIndex(null, cell);
            }
        }

        if (completed) temporaryIndices = [];

        if (/^\d+$/.test(row + []) && row < timetable.length && /^\d+$/.test(cell + []) && cell < timetable[0].length) {
            selectCellIndex(row, cell);
        }

        if (/^\d+$/.test(temporaryIndices[0] + []) && /^\d+$/.test(temporaryIndices[1] + [])) {
            clearCellIndex(...temporaryIndices);
        }

        temporaryIndices = [row !== undefined ? row : temporaryIndices[0], cell !== undefined ? cell : temporaryIndices[1]];
    }

    setCursor(cursorPos, gotoPrompt);
}, false);

function showPrompt(cmd) {
    gotoPromptVisible = true;
    promptText = cmd;
    promptCmd = cmd;
    temporaryIndices = [];

    gotoPrompt.innerText = cmd;
    gotoPrompt.style.display = 'block';

    gotoPrompt.focus();
    cursorPos = 1;
    setCursor(cursorPos, gotoPrompt);
}

window.addEventListener('keyup', e => {
    switch (e.key) {
        case 'Escape':
            if (gotoPromptVisible) {
                gotoPrompt.style.display = 'none';
                gotoPromptVisible = false;
                clearIndex(...temporaryIndices);
            } else {
                clearSelection();
            }
            break;
        case '/':
        case '\'':
            showPrompt(e.key);
            break;
        default:
            //console.log(e.key);
            console.log();
    }
}, false);

renderTable(timetable);