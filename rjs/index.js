const headers = ['TIME', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const tableElement = document.querySelector('#timetable');
const gotoPrompt = document.querySelector('#goto-prompt');

let timetable = getData();

let currentCell;
let hoveredCell;

let gotoPromptVisible = false;
let promptText;
let promptCmd;

let cursorPos;

function clearElement(elem) {
    while (elem.firstNode) {
        elem.removeChild(elem.firstNode);
    }
}

function selectCell(row, cell) {
    if (currentCell && currentCell.length) {
        document.querySelector(`#row-${currentCell[0]}`).classList.remove('active-index');
        document.querySelector(`#cell-${currentCell[1]}`).classList.remove('active-index');
        document.querySelector(`#c-${currentCell[0]}-${currentCell[1]}`).classList.remove('active-cell');
    }
    currentCell = [row, cell];
    hoveredCell = [];

    document.querySelector(`#row-${currentCell[0]}`).classList.add('active-index');
    document.querySelector(`#cell-${currentCell[1]}`).classList.add('active-index');

    document.querySelector(`#c-${currentCell[0]}-${currentCell[1]}`).classList.add('active-cell');
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
                    const indices = e.currentTarget.getAttribute('id').split('-').slice(1);
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
    if (currentCell && currentCell.length) {
        document.querySelector(`#row-${currentCell[0]}`).classList.remove('active-index');
        document.querySelector(`#cell-${currentCell[1]}`).classList.remove('active-index');
        document.querySelector(`#c-${currentCell[0]}-${currentCell[1]}`).classList.remove('active-cell');

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

const gotoSequence = [/^\/\d+$/, /^\/\d+\.$/, /^\/\d+\.\d+$/];
const swapSequence = [/^\'\d+$/, /^\'\d+\.$/, /^\'\d+\.\d+$/, /^\'\d+\.\d+\,$/, /^\'\d+\.\d+\,\d+$/, /^\'\d+\.\d+\,\d+\.$/, /^\'\d+\.\d+\,\d+\.\d+$/];
gotoPrompt.addEventListener('keydown', e => {
    e.preventDefault();

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
            const [row, cell] = promptText.slice(1).split('.').map(x => x | 0);
            if (row < timetable.length && cell < timetable[0].length) {
                selectCell(row, cell);
            }
        } else {

        }
        gotoPrompt.style.display = 'none';
    }

    setCursor(cursorPos, gotoPrompt);
}, false);

function showPrompt(cmd) {
    gotoPromptVisible = true;
    promptText = cmd;
    promptCmd = cmd;

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
            } else {
                clearSelection();
            }
            break;
        case '/':
        case '\'':
            showPrompt(e.key);
            break;
        default:
            console.log(e.key);
    }
}, false);

renderTable(timetable);