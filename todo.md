# TODO
- [ ] Add all unique subjects to the subject bar with number of occurrences
    * Create prompt for adding subjects
- [x] `/{row}.{cell} + Enter` selects given cell
    - [x] Incrementally shows cell(s) being selected by highlighting row/column
    - [ ] Shift to select multiple cells or `/{row_1}.{cell_1},{row_2}.{cell_2} + Enter`
    - [ ] Swap cells by selecting them, then inputing target with `'{row}.{cell} + Enter`
    - [ ] Clear cells via backspace
- [ ] Allow adding of subject to schedule by selecting it, then either clicking on cell or inputing it in the format: `/{row}.{cell} + Enter`
    * Shortcut to toggle focus between subject bar and timetable (`s`/`t`), `Esc` to remove focus, shows hidden index numbers on focused area
    * `j` and `k` to navigate left and right between 10 subjects at a time, selected using `0-9`
    * Delete subject by selecting it, then pressing backspace
- [ ] Have default schedule (and ability to set schedule as default) and reset button with weekly automatic resets
- [ ] Have `Cmd+Z`/`Cmd+Shift+Z`
- [ ] Add import/export functionality from menu bar
    * Consider drag-and-drop to set other default schedule