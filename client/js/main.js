import { setupScriptEditor, exportScriptAsPDF } from './scriptEditor.js';

document.addEventListener('DOMContentLoaded', () => {
    setupScriptEditor();
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportScriptAsPDF);
    }
});
