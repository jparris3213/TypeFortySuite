
const AREAS = [
    { name: 'LOCATION', align: 'left', caps: true, width: '100%' },
    { name: 'DESCRIPTION', align: 'left', caps: false, width: '75' },
    { name: 'CHARACTER', align: 'center', caps: true, width: '40%' },
    { name: 'DIALOGUE', align: 'center', caps: false, width: '45%' },
    { name: 'TRANSITION', align: 'right', caps: true, width: '100%' }
];

let lines = [ { text: '', areaIdx: 0 } ];
let currentLine = 0;

export function setupScriptEditor() {
    const editor = document.getElementById('scriptEditor');
    const areaLabel = document.getElementById('area-label');
    // Expose script data and helpers for sidebar
    window.lines = lines;
    window.AREAS = AREAS;
    window.currentLine = currentLine;
    window.render = render;

    function updateAreaIndicator() {
        areaLabel.textContent = AREAS[lines[currentLine].areaIdx].name;
    }

    function render(highlightCurrent = false) {
        editor.innerHTML = '';
        let lastAreaIdx = null;
        lines.forEach((line, idx) => {
            const area = AREAS[line.areaIdx];
            let text = area.caps ? line.text.toUpperCase() : line.text;
            // Insert a blank line if category changes (except for first line)
            if (lastAreaIdx !== null && line.areaIdx !== lastAreaIdx) {
                let spacer = document.createElement('div');
                spacer.className = 'script-spacer';
                spacer.style.height = '1em';
                spacer.innerHTML = '&nbsp;';
                editor.appendChild(spacer);
            }
            let div = document.createElement('div');
            div.className = 'script-line';
            div.setAttribute('data-area', area.name);
            div.contentEditable = false;
            div.style.display = 'block';
            // Only set textAlign and width for non-DESCRIPTION types (let CSS handle Description)
            if (area.name !== 'DESCRIPTION') {
                div.style.textAlign = area.align;
                div.style.width = area.width;
            }
            div.style.whiteSpace = 'pre-wrap';
            if (area.align === 'left') {
                div.style.marginLeft = '0';
                div.style.marginRight = 'auto';
            } else if (area.align === 'right') {
                div.style.marginRight = '0';
                div.style.marginLeft = 'auto';
            } else {
                div.style.margin = 'auto';
            }
            div.innerText = text || '\u00A0';
            if (idx === currentLine) {
                div.contentEditable = true;
            }
            // Allow clicking any line to edit it
            div.addEventListener('click', function() {
                if (currentLine !== idx) {
                    currentLine = idx;
                    render();
                }
            });
            editor.appendChild(div);
            lastAreaIdx = line.areaIdx;
        });
        // Always focus and set caret after render
        const divs = editor.querySelectorAll('.script-line');
        if (divs[currentLine]) {
            divs[currentLine].focus();
            placeCaretAtEnd(divs[currentLine]);
            // highlightCurrent is now a no-op
        }
        updateAreaIndicator();
    }

    function placeCaretAtEnd(el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    // Use event delegation to robustly trap Tab, Enter, and arrow keys
    editor.addEventListener('keydown', function(e) {
        const divs = editor.querySelectorAll('.script-line');
        if (divs[currentLine] && e.target === divs[currentLine]) {
            // Ctrl+. to cycle forward, Ctrl+, to cycle backward
            if (e.ctrlKey && e.key === '.') {
                e.preventDefault();
                lines[currentLine].areaIdx = (lines[currentLine].areaIdx + 1) % AREAS.length;
                render(true);
            } else if (e.ctrlKey && e.key === ',') {
                e.preventDefault();
                lines[currentLine].areaIdx = (lines[currentLine].areaIdx - 1 + AREAS.length) % AREAS.length;
                render(true);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                // Determine next areaIdx based on current line's area
                let nextAreaIdx = 0; // Default to LOCATION
                const currentArea = AREAS[lines[currentLine].areaIdx].name;
                if (currentArea === 'LOCATION') {
                    nextAreaIdx = AREAS.findIndex(a => a.name === 'DESCRIPTION');
                } else if (currentArea === 'DESCRIPTION') {
                    nextAreaIdx = AREAS.findIndex(a => a.name === 'CHARACTER');
                } else if (currentArea === 'CHARACTER') {
                    nextAreaIdx = AREAS.findIndex(a => a.name === 'DIALOGUE');
                } else if (currentArea === 'DIALOGUE') {
                    nextAreaIdx = AREAS.findIndex(a => a.name === 'DESCRIPTION');
                } else {
                    nextAreaIdx = 0; // fallback to LOCATION
                }
                lines.splice(currentLine + 1, 0, { text: '', areaIdx: nextAreaIdx });
                currentLine++;
                render();
            } else if (e.key === 'ArrowUp') {
                if (currentLine > 0) {
                    e.preventDefault();
                    currentLine--;
                    render();
                }
            } else if (e.key === 'ArrowDown') {
                if (currentLine < lines.length - 1) {
                    e.preventDefault();
                    currentLine++;
                    render();
                }
            }
        }
    });

    editor.addEventListener('input', function(e) {
        // Update line text
        const divs = editor.querySelectorAll('.script-line');
        if (divs[currentLine]) {
            lines[currentLine].text = divs[currentLine].innerText.replace(/\u00A0/g, '');
        }
    });


    // Initial render
    render();
}

// Export script as PDF with identical formatting
export function getScriptJSON() {
    // Always export from the global lines array for consistency
    return JSON.parse(JSON.stringify(window.lines || lines));
}

export function loadScriptJSON(json) {
    if (!Array.isArray(json)) {
        alert('Invalid script JSON format.');
        return;
    }
    lines.length = 0;
    json.forEach(obj => {
        if (typeof obj === 'object' && 'text' in obj && 'areaIdx' in obj) {
            lines.push({ text: obj.text, areaIdx: obj.areaIdx });
        }
    });
    if (lines.length === 0) lines.push({ text: '', areaIdx: 0 });
    currentLine = 0;
    window.lines = lines;
    window.currentLine = currentLine;
    if (typeof window.render === 'function') {
        window.render();
    } else {
        render();
    }
}

export function exportScriptAsPDF() {
    // Use jsPDF to export the script with new formatting standards
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    // 1 inch = 72pt
    const standards = {
        LOCATION:    { left: 1.5 * 72, right: 7.5 * 72, align: 'left', caps: true },
        DESCRIPTION: { left: 1.5 * 72, right: 7.5 * 72, align: 'left', caps: false },
        CHARACTER: { left: 3.5 * 72, right: 5.5 * 72, align: 'center', caps: true },
        DIALOGUE:    { left: 2.5 * 72, right: 5.5 * 72, align: 'left', caps: false },
        TRANSITION:  { left: 6 * 72, right: 7.5 * 72, align: 'right', caps: true }
    };
    let y = 72; // 1 inch from top
    const lineHeight = 20;
    // Get lines from the editor
    const editor = document.getElementById('scriptEditor');
    const divs = editor.querySelectorAll('.script-line');
    let lastAreaName = null;
    divs.forEach((div, idx) => {
        const areaName = div.getAttribute('data-area');
        let text = div.innerText.replace(/\u00A0/g, '').trim();
        const fmt = standards[areaName] || standards.DESCRIPTION;
        if (fmt.caps) text = text.toUpperCase();
        let x = fmt.left;
        let width = fmt.right - fmt.left;
        let align = fmt.align;
        doc.setFont('Courier', fmt.caps ? 'bold' : 'normal');
        doc.setFontSize(12);
        // Insert a blank line if category changes (except for first line)
        if (lastAreaName !== null && areaName !== lastAreaName) {
            y += lineHeight;
        }
        // For Dialogue, manually wrap text at width and restart at 2.5" for overflow
        if (areaName === 'DIALOGUE') {
            const words = text.split(' ');
            let line = '';
            words.forEach((word, i) => {
                const testLine = line.length ? line + ' ' + word : word;
                const testWidth = doc.getTextWidth(testLine);
                if (testWidth > width && line.length) {
                    doc.text(line, x, y, { maxWidth: width, align });
                    y += lineHeight;
                    line = word;
                } else {
                    line = testLine;
                }
            });
            if (line.length) {
                doc.text(line, x, y, { maxWidth: width, align });
                y += lineHeight;
            }
        } else {
            doc.text(text || ' ', x, y, { maxWidth: width, align });
            y += lineHeight;
        }
        // Add new page if needed
        if (y > doc.internal.pageSize.getHeight() - 72) {
            doc.addPage();
            y = 72;
        }
        lastAreaName = areaName;
    });
    doc.save('script.pdf');
}
