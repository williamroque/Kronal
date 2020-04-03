const isDev = require('electron-is-dev');

const headers = ['TIME', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const tableElement = document.querySelector('#timetable');
const prompt = document.querySelector('#prompt');

const subjectRow = document.querySelector('#subjects-row');
const leftIndicator = document.querySelector('#left-indicator');
const rightIndicator = document.querySelector('#right-indicator');

const widthTest = document.querySelector('#width-test');

let selectedSubjectCell;

let currentRange = 0;

let { timestamp, timetable, subjects } = getData();

let searchBuffer = [];
let searchIndex = 0;

let subjectCountMap = {};
subjects.forEach(subject => {
    subjectCountMap[subject] = 0;
});
function compileSubjects() {
    subjects.forEach(subject => {
        subjectCountMap[subject] = 0;
    });
    for (let rowIndex = 0; rowIndex < timetable.length; rowIndex++) {
        for (let cellIndex = 0; cellIndex < timetable[0].length; cellIndex++) {
            let cell = timetable[rowIndex][cellIndex];

            if (cell) {
                subjectCountMap[cell]++;
            }
        }
    }
}
compileSubjects();

let currentCell = [];
let hoveredCell = [];

let selectedCells = [];

let promptVisible = false;
let promptText;
let promptCmd;
let temporaryIndices = [];

let cursorPos;

let actions = [];
let undoBuffer = [];

let clipboard;

function renderText(cell, text) {
    document.querySelector(`#c-${cell[0]}-${cell[1]}`).innerText = text;
}

function swapCells(cell1, cell2, action = true) {
    if (!(cell1[0] === cell2[0] && cell1[1] === cell2[1])) {
        if (action) {
            actions.push({ type: 'swap', cells: [cell1, cell2] });
            undoBuffer = [];
        }

        [timetable[cell1[0]][cell1[1]], timetable[cell2[0]][cell2[1]]] =
            [timetable[cell2[0]][cell2[1]], timetable[cell1[0]][cell1[1]]];

        renderText(cell1, timetable[cell1[0]][cell1[1]]);
        renderText(cell2, timetable[cell2[0]][cell2[1]]);

        update(timetable, subjects, timestamp);
    }
}

function setCell(cell, text, action = true) {
    if (action) {
        actions.push({
            type: 'set',
            cell: cell,
            content: timetable[cell[0]][cell[1]],
            targetContent: text
        });
        undoBuffer = [];
    }

    timetable[cell[0]][cell[1]] = text;
    renderText(cell, text);

    update(timetable, subjects, timestamp);
    compileSubjects();
    renderSubjects(currentRange);
}

function clearSubjectSelection() {
    if (selectedSubjectCell !== undefined) {
        document.querySelector(`#subject-cell-${selectedSubjectCell - 1}`).classList.remove('active-subject-cell');
        document.querySelector(`#subject-index-${selectedSubjectCell - 1}`).classList.remove('active-subject-index');

        selectedSubjectCell = undefined;
    }
}

function clearCellSelection() {
    selectedCells.forEach(cell => {
        clearIndex(...cell);
        clearCellIndex(...cell);
    });

    currentCell = [];
    selectedCells = [];
}

function clearSelection() {
    clearCellSelection();
    clearSubjectSelection();
}

function undo() {
    if (actions.length) {
        const action = actions.pop();
        undoBuffer.push(action);

        if (action.type === 'swap') {
            swapCells(...action.cells, false);
        } else {
            setCell(action.cell, action.content, false);
        }

        clearSelection();
    }
}

function redo() {
    if (undoBuffer.length) {
        const action = undoBuffer.pop();
        actions.push(action);

        if (action.type === 'swap') {
            swapCells(...action.cells, false);
        } else {
            setCell(action.cell, action.targetContent, false);
        }

        clearSelection();
    }
}

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

function selectCellIndex(row, cell, type) {
    if (/^\d+$/.test(row + []) && row < timetable.length && /^\d+$/.test(cell + []) && cell < timetable[0].length) {
        document.querySelector(`#c-${row}-${cell}`).classList.add('active-cell');
        if (type === 'objective') document.querySelector(`#c-${row}-${cell}`).classList.add('objective');
    }
}

function clearCellIndex(row, cell) {
    if (/^\d+$/.test(row + []) && row < timetable.length && /^\d+$/.test(cell + []) && cell < timetable[0].length) {
        document.querySelector(`#c-${row}-${cell}`).classList.remove('active-cell');
        document.querySelector(`#c-${row}-${cell}`).classList.remove('objective');
    }
}

function selectCell(row, cell) {
    currentCell = [row, cell];
    hoveredCell = [];

    selectedCells.push(currentCell);

    selectIndex(...currentCell);
    selectCellIndex(...currentCell, 'subjective');
}

function selectSubjectCell(cell) {
    if (selectedSubjectCell !== undefined) {
        document.querySelector(`#subject-cell-${selectedSubjectCell - 1}`).classList.remove('active-subject-cell');
        document.querySelector(`#subject-index-${selectedSubjectCell - 1}`).classList.remove('active-subject-index');
    }

    selectedSubjectCell = cell | 0;
    document.querySelector(`#subject-cell-${selectedSubjectCell - 1}`).classList.add('active-subject-cell');
    document.querySelector(`#subject-index-${selectedSubjectCell - 1}`).classList.add('active-subject-index');
}

function incrementallySelect(type) {
    const [row, cell] = promptText.slice(1).split('.').map(x => /^\d+$/.test(x + []) ? x | 0 : undefined);

    if (temporaryIndices.length && (temporaryIndices[0] < timetable.length && temporaryIndices[0] !== currentCell[0] && temporaryIndices[0] !== row && temporaryIndices[0] !== hoveredCell[0] || row === undefined)) {
        clearIndex(temporaryIndices[0], null);
    }

    if (row < timetable.length) {
        selectIndex(row, null);
    }

    if (temporaryIndices.length && (temporaryIndices[1] < timetable[0].length && temporaryIndices[1] !== currentCell[1] && temporaryIndices[1] !== cell && temporaryIndices[1] !== hoveredCell[1] || cell === undefined)) {
        clearIndex(null, temporaryIndices[1]);
    }

    if (cell < timetable[0].length) {
        selectIndex(null, cell);
    }

    if (/^\d+$/.test(row + []) && row < timetable.length && /^\d+$/.test(cell + []) && cell < timetable[0].length) {
        selectCellIndex(row, cell, type);
        selectedCells.push([row, cell]);
    }

    if (/^\d+$/.test(temporaryIndices[0] + []) && /^\d+$/.test(temporaryIndices[1] + []) && (temporaryIndices[0] !== row || temporaryIndices[1] !== cell)) {
        clearCellIndex(...temporaryIndices);
    }

    temporaryIndices = [row !== undefined ? row : temporaryIndices[0], cell !== undefined ? cell : temporaryIndices[1]];
}

function renderTable(timetable) {
    clearElement(tableElement);

    let headerRowElement = document.createElement('TR');
    headerRowElement.classList.add('header-row');
    [...headers, ''].forEach((header, i) => {
        let headerElement = document.createElement('TH');
        headerElement.classList.add('header');

        if (i === 0) {
            headerElement.classList.add('table-time');
        } else if (i === headers.length) {
            headerElement.classList.add('table-index');
        }

        let headerText = document.createTextNode(header);

        headerElement.appendChild(headerText);
        headerRowElement.appendChild(headerElement);
    });
    tableElement.appendChild(headerRowElement);

    for (let rowIndex = 0; rowIndex < timetable.length; rowIndex++) {
        let rowElement = document.createElement('TR');

        for (let cellIndex = 0; cellIndex < timetable[0].length + 2; cellIndex++) {
            let tableCellElement = document.createElement('TD');
            let cellElement = document.createElement('DIV');

            let cellClass, cellText;
            if (cellIndex === 0) {
                tableCellElement.classList.add('table-time');

                cellClass = 'time';
                cellText = `${(rowIndex + 7).toString().padStart(2, '0')}:00`;
            } else if (cellIndex === timetable[0].length + 1) {
                tableCellElement.classList.add('table-index');

                cellClass = 'row-index';
                cellText = rowIndex;
                cellElement.setAttribute('id', `row-${rowIndex}`);
            } else {
                tableCellElement.classList.add('table-cell');

                cellClass = 'cell';
                cellText = timetable[rowIndex][cellIndex - 1];
                cellElement.setAttribute('id', `c-${rowIndex}-${cellIndex - 1}`);

                cellElement.addEventListener('mouseenter', e => {
                    const [rowIndex, cellIndex] = e.currentTarget.getAttribute('id').split('-').slice(1).map(x => x | 0);

                    if (hoveredCell.length) {
                        if (hoveredCell[0] !== currentCell[0] && hoveredCell[0] !== temporaryIndices[0]) {
                            clearIndex(hoveredCell[0], null);
                        }

                        if (hoveredCell[1] !== currentCell[1] && hoveredCell[1] !== temporaryIndices[1]) {
                            clearIndex(null, hoveredCell[1]);
                        }
                    }

                    hoveredCell = [rowIndex, cellIndex];
                    selectIndex(...hoveredCell, currentCell);
                }, false);
                cellElement.addEventListener('mouseleave', e => {
                    const [rowIndex, cellIndex] = e.currentTarget.getAttribute('id').split('-').slice(1).map(x => x | 0);

                    if (rowIndex !== currentCell[0] && rowIndex !== temporaryIndices[0]) {
                        clearIndex(rowIndex, null);
                    }

                    if (cellIndex !== currentCell[1] && cellIndex !== temporaryIndices[1]) {
                        clearIndex(null, cellIndex);
                    }
                }, false);
                cellElement.addEventListener('click', e => {
                    const indices = e.currentTarget.getAttribute('id').split('-').slice(1).map(x => x | 0);

                    if (promptCmd === '\'') {
                        e.stopPropagation();

                        promptText = `'${indices[0]}.${indices[1]}`;
                        prompt.innerText = promptText;

                        prompt.focus();
                        cursorPos = promptText.length;
                        setCursor(cursorPos, prompt);

                        if (indices[0] === currentCell[0] && indices[1] === currentCell[1]) {
                            if (currentCell[0] !== temporaryIndices[0]) {
                                clearIndex(temporaryIndices[0], null);
                            }

                            if (currentCell[1] !== temporaryIndices[1]) {
                                clearIndex(null, temporaryIndices[1]);
                            }

                            if (!(currentCell[0] === temporaryIndices[0] && currentCell[1] === temporaryIndices[1])) {
                                clearCellIndex(...temporaryIndices);
                            }
                        } else {
                            incrementallySelect('objective');
                        }
                    } else {
                        clearCellSelection();
                        selectCell(...indices);
                    }
                }, false);
            }

            cellElement.classList.add(cellClass);
            let cellTextElement = document.createTextNode(cellText);

            cellElement.appendChild(cellTextElement);
            tableCellElement.appendChild(cellElement);
            rowElement.appendChild(tableCellElement);
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

document.addEventListener('click', () => {
    prompt.style.display = 'none';
}, false);

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
prompt.addEventListener('keydown', e => {
    e.preventDefault();
    if (e.key !== 'Escape') e.stopPropagation();

    let completed = false;

    const key = e.key;
    if (promptText.length < 18 && key.length === 1) {
        let proText = promptText.slice(0, cursorPos) + key + promptText.slice(cursorPos, prompt.length);
        widthTest.innerText = proText.slice(1);
        if (
            promptCmd === '/' && gotoSequence.some(pattern => pattern.test(proText)) ||
            promptCmd === '\'' && swapSequence.some(pattern => pattern.test(proText)) ||
            promptCmd === '?' && /^[A-Za-z]$/.test(key) ||
            promptCmd === '+' && widthTest.clientWidth + 1 <= 85
        ) {
            promptText = proText;
            prompt.innerText = promptText;
            cursorPos++;
        }
    }

    if (key === 'Backspace' || key === 'Clear') {
        if (promptText.length === 1) {
            prompt.style.display = 'none';
        } else {
            if (e.metaKey) {
                promptText = promptCmd + promptText.slice(cursorPos, promptText.length);
                prompt.innerText = promptText;
                cursorPos = 1;
            } else {
                proText = promptText.slice(0, cursorPos - 1) + promptText.slice(cursorPos, promptText.length);
                if (!(/\./.test(proText)) || /\./.test(proText) && !proText.slice(1).split('.').every(x => x === '')) {
                    promptText = proText;
                    prompt.innerText = promptText;
                    cursorPos--;
                }
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
            if (gotoSequence[2].test(promptText)) {
                const [row, cell] = promptText.slice(1).split('.').map(x => x | 0);
                if (row < timetable.length && cell < timetable[0].length) {
                    clearCellSelection();
                    selectCell(row, cell);
                    completed = true;
                }
            } else if (gotoSequence[6].test(promptText)) {

            }
        } else if (promptCmd === '\'') {
            if (swapSequence[2].test(promptText)) {
                const [row, cell] = promptText.slice(1).split('.').map(x => x | 0);
                if (row < timetable.length && cell < timetable[0].length) {
                    swapCells(currentCell, [row, cell]);
                    clearSelection();
                    completed = true;
                }
            }
        } else if (promptCmd === '?') {
            if (promptText.slice(1)) {
                timetable.forEach((row, i) => {
                    row.forEach((cell, j) => {
                        if (new RegExp(promptText.slice(1), 'i').test(cell)) {
                            searchBuffer.push([i, j]);
                        }
                    });
                });

                if (searchBuffer.length) {
                    searchIndex = 0;

                    clearSelection();
                    selectCell(...searchBuffer[searchIndex]);
                    completed = true;
                }
            }
        } else {
            if (subjects.indexOf(promptText.slice(1)) < 0) {
                subjects.push(promptText.slice(1));
                subjects = subjects.sort();
                compileSubjects();
                renderSubjects(currentRange);
                update(timetable, subjects, timestamp);
                completed = true;
            }
        }

        if (completed) {
            prompt.style.display = 'none';
            promptVisible = false;
            promptText = '';
            promptCmd = '';
        }
    }

    if (promptCmd === '/' || promptCmd === '\'') {
        if (completed) temporaryIndices = [];
        incrementallySelect(promptCmd === '/' ? 'subjective' : 'objective');
    }

    setCursor(cursorPos, prompt);
}, false);

function showPrompt(cmd) {
    promptVisible = true;
    promptText = cmd;
    promptCmd = cmd;
    temporaryIndices = [];

    prompt.innerText = cmd;
    prompt.style.display = 'block';

    prompt.focus();
    cursorPos = 1;
    setCursor(cursorPos, prompt);
}

function renderSubjects(range) {
    if (range === 0) {
        leftIndicator.classList.add('shift-indicator-disabled');
    } else {
        leftIndicator.classList.remove('shift-indicator-disabled');
    }

    if (range + 8 >= Object.keys(subjectCountMap).length) {
        rightIndicator.classList.add('shift-indicator-disabled');
    } else {
        rightIndicator.classList.remove('shift-indicator-disabled');
    }

    const subjectCellElements = [...subjectRow.childNodes].filter(node => node.nodeType === Node.ELEMENT_NODE);
    subjects.sort().slice(range, range + 8).forEach((subject, i) => {
        const subjectCellElement = subjectCellElements[i];
        if (subjectCellElement.firstChild) {
            subjectCellElement.firstChild.remove();
        }

        const subjectElement = document.createElement('DIV');
        subjectElement.classList.add('subject-wrapper');
        subjectElement.setAttribute('id', `subject-cell-${i}`);

        subjectElement.addEventListener('click', e => {
            const index = (e.currentTarget.getAttribute('id').split('-')[2] | 0) + 1;
            selectSubjectCell(index);
        }, false);

        const subjectTitleElement = document.createElement('DIV');
        subjectTitleElement.classList.add('subject-title');
        const subjectTitle = document.createTextNode(subject);
        subjectTitleElement.appendChild(subjectTitle);

        const subjectCountElement = document.createElement('DIV');
        subjectCountElement.classList.add('subject-count');
        const subjectCount = document.createTextNode(subjectCountMap[subject]);
        subjectCountElement.appendChild(subjectCount);

        subjectElement.appendChild(subjectTitleElement);
        subjectElement.appendChild(subjectCountElement);
        subjectCellElement.appendChild(subjectElement);
    });
}
renderSubjects(currentRange);

document.addEventListener('keydown', e => {
    if (!(e.key === 'q' && e.metaKey)) {
        e.preventDefault();
    }
    switch (e.key) {
        case 'Escape':
            if (promptVisible) {
                prompt.style.display = 'none';
                promptVisible = false;
                promptCmd = '';
                clearIndex(...temporaryIndices);
                clearCellIndex(...temporaryIndices);
            } else {
                clearSelection();
            }
            break;
        case 'Clear':
        case 'Backspace':
            if (!promptVisible) {
                if (selectedSubjectCell !== undefined) {
                    subjects = subjects.filter((_, i) => i !== currentRange + selectedSubjectCell - 1).sort();
                    compileSubjects();
                    renderSubjects(currentRange);
                    update(timetable, subjects, timestamp);
                    clearSubjectSelection();
                } else {
                    setCell(currentCell, '');
                }
            }
            break;
        case '/':
            showPrompt('/');
            break;
        case '*':
        case '\'':
            if (currentCell.length) {
                showPrompt('\'');
            }
            break;
        case '?':
            showPrompt('?');
            break;
        case '+':
            showPrompt('+');
            break;
        case 'z':
            if (e.metaKey || isDev) {
                undo();
            }
            break;
        case 'Z':
            if (e.metaKey || isDev) {
                redo();
            }
            break;
        case 'j':
            if (currentRange - 1 >= 0) {
                renderSubjects(--currentRange);
            }
            clearSubjectSelection();
            break;
        case 'k':
            if (currentRange + 8 < Object.keys(subjectCountMap).length) {
                renderSubjects(++currentRange);
            }
            clearSubjectSelection();
            break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
            if (!promptVisible) {
                selectSubjectCell(e.key);
            }
            break;
        case ' ':
            if (selectedCells.length && selectedSubjectCell !== undefined) {
                setCell(selectedCells[0], subjects[currentRange + selectedSubjectCell - 1]);
                clearSubjectSelection();
            }
            break;
        case 'ArrowDown':
            if (currentCell.length && currentCell[0] + 1 < timetable.length) {
                let row = currentCell[0] + 1;
                let cell = currentCell[1];

                clearSelection();
                selectCell(row, cell);
            }
            break;
        case 'ArrowRight':
            if (currentCell.length && currentCell[1] + 1 < timetable[0].length) {
                let row = currentCell[0];
                let cell = currentCell[1] + 1;

                clearSelection();
                selectCell(row, cell);
            }
            break;
        case 'ArrowUp':
            if (currentCell.length && currentCell[0] > 0) {
                let row = currentCell[0] - 1;
                let cell = currentCell[1];

                clearSelection();
                selectCell(row, cell);
            }
            break;
        case 'ArrowLeft':
            if (currentCell.length && currentCell[1] > 0) {
                let row = currentCell[0];
                let cell = currentCell[1] - 1;

                clearSelection();
                selectCell(row, cell);
            }
            break;
        case 'n':
            searchIndex = (searchIndex + 1) % searchBuffer.length;
            clearSelection();
            selectCell(...searchBuffer[searchIndex]);
            break;
        case 'N':
            searchIndex = (searchIndex + searchBuffer.length - 1) % searchBuffer.length;
            clearSelection();
            selectCell(...searchBuffer[searchIndex]);
            break;
        case 'x':
            if (currentCell.length) {
                clipboard = timetable[currentCell[0]][currentCell[1]];
                setCell(currentCell, '');
            }
            break;
        case 'y':
            if (currentCell.length) {
                clipboard = timetable[currentCell[0]][currentCell[1]];
            }
            break;
        case 'p':
            if (clipboard && currentCell.length) {
                console.log(clipboard);
                setCell(currentCell, clipboard);
            }
            break;
        default:
            console.log(e.key);
    }
}, false);

renderTable(timetable);
