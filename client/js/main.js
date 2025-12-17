import { setupScriptEditor, exportScriptAsPDF, getScriptJSON, loadScriptJSON } from './scriptEditor.js';

function updateCharacterSidebar() {
    const { lines, AREAS } = getScriptLinesAndAreas();
    if (!lines || !AREAS || !AREAS.length) return;
    const charList = document.getElementById('character-list');
    if (!charList) return;
    charList.innerHTML = '';
    const seen = new Set();
    lines.forEach((line) => {
        if (AREAS[line.areaIdx] && AREAS[line.areaIdx].name === 'CHARACTER') {
            const name = line.text.trim().toUpperCase();
            if (name && !seen.has(name)) {
                seen.add(name);
                const div = document.createElement('div');
                div.className = 'character-link';
                div.textContent = name;
                charList.appendChild(div);
            }
        }
    });
}


// Helper to get script lines and AREAS from scriptEditor.js context
function getScriptLinesAndAreas() {
    // Try to access global lines and AREAS if available
    const win = window;
    if (win.lines && win.AREAS) {
        return { lines: win.lines, AREAS: win.AREAS };
    }
    // Fallback: try to get from scriptEditor module if exported (not in current code)
    return { lines: [], AREAS: [] };
}

function updateSceneSidebar() {
    const { lines, AREAS } = getScriptLinesAndAreas();
    if (!lines || !AREAS || !AREAS.length) return;
    const sceneList = document.getElementById('scene-list');
    if (!sceneList) return;
    sceneList.innerHTML = '';
    let sceneCount = 0;
    lines.forEach((line, idx) => {
        if (AREAS[line.areaIdx] && AREAS[line.areaIdx].name === 'LOCATION' && line.text.trim()) {
            sceneCount++;
            const div = document.createElement('div');
            div.className = 'scene-link';
            // Capitalize like in script: LOCATION is always caps
            const locationText = line.text.trim().toUpperCase();
            div.textContent = `${sceneCount}: ${locationText}`;
            div.style.cursor = 'pointer';
            div.style.padding = '0.3em 0.5em';
            div.style.borderRadius = '4px';
            div.style.marginBottom = '0.2em';
            div.style.transition = 'background 0.2s';
            div.addEventListener('mouseenter', () => div.style.background = '#e0e0e0');
            div.addEventListener('mouseleave', () => div.style.background = '');
            div.addEventListener('click', () => {
                // Focus the corresponding script line
                window.currentLine = idx;
                if (typeof window.render === 'function') window.render();
                // Scroll to the script line in the editor
                const editor = document.getElementById('scriptEditor');
                const divs = editor.querySelectorAll('.script-line');
                if (divs[idx]) {
                    divs[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
                    divs[idx].focus();
                }
            });
            sceneList.appendChild(div);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupScriptEditor();
    // Top nav event listeners
    const exportPDF = document.getElementById('nav-export-pdf');
    if (exportPDF) {
        exportPDF.addEventListener('click', (e) => {
            e.preventDefault();
            exportScriptAsPDF();
        });
    }
    // Export to JSON
    const exportJSON = document.getElementById('nav-export-json');
    if (exportJSON) {
        exportJSON.addEventListener('click', (e) => {
            e.preventDefault();
            const data = getScriptJSON();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'script.json';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        });
    }
    // Import from JSON
    const importJSON = document.getElementById('nav-import-json');
    if (importJSON) {
        importJSON.addEventListener('click', (e) => {
            e.preventDefault();
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json';
            input.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (evt) => {
                    try {
                        const json = JSON.parse(evt.target.result);
                        loadScriptJSON(json);
                    } catch (err) {
                        alert('Invalid JSON file.');
                    }
                };
                reader.readAsText(file);
            });
            input.click();
        });
    }
    // Poll for changes to lines and update both sidebars
    setInterval(() => {
        updateSceneSidebar();
        updateCharacterSidebar();
    }, 500);
});
