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
import { setupScriptEditor, exportScriptAsPDF } from './scriptEditor.js';

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
            div.textContent = `Scene ${sceneCount}: ${locationText}`;
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
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportScriptAsPDF);
    }
    // Poll for changes to lines and update both sidebars
    setInterval(() => {
        updateSceneSidebar();
        updateCharacterSidebar();
    }, 500);
});
