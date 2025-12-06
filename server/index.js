


const editor = document.getElementById('scriptEditor');
const areaLabel = document.getElementById('area-label');

const AREAS = [
	{ name: 'LOCATION', align: 'left', caps: true, width: '100%' },
	{ name: 'DESCRIPTION', align: 'center', caps: false, width: '66%' },
	{ name: 'CHARACTER', align: 'center', caps: true, width: '40%' },
	{ name: 'DIALOGUE', align: 'center', caps: false, width: '33%' },
	{ name: 'TRANSITION', align: 'right', caps: true, width: '100%' }
];

let currentAreaIdx = 0;
let lastAreaIdx = 0;

function updateAreaIndicator() {
	areaLabel.textContent = AREAS[currentAreaIdx].name;
}

function inferNextAreaIdx(prevIdx, prevLine) {
	if (AREAS[prevIdx].name === 'CHARACTER') return 3; // DIALOGUE
	if (AREAS[prevIdx].name === 'DIALOGUE') return 0; // LOCATION
	if (AREAS[prevIdx].name === 'LOCATION') return 1; // DESCRIPTION
	if (AREAS[prevIdx].name === 'DESCRIPTION') return 2; // CHARACTER
	if (AREAS[prevIdx].name === 'TRANSITION') return 0; // LOCATION
	return 0;
}

function formatCurrentLine() {
	// Get the current line node
	const sel = window.getSelection();
	if (!sel.rangeCount) return;
	let node = sel.anchorNode;
	// If the node is a text node, get its parent div
	if (node.nodeType === 3) node = node.parentNode;
	if (!node || !node.classList || !node.classList.contains('script-line')) return;
	// Format the line
	const area = AREAS[currentAreaIdx];
	let text = node.innerText;
	if (area.caps) text = text.toUpperCase();
	node.innerText = text;
	node.style.textAlign = area.align;
	node.style.width = area.width;
	node.setAttribute('data-area', area.name);
	if (area.align === 'left') {
		node.style.marginLeft = '0';
		node.style.marginRight = 'auto';
	} else if (area.align === 'right') {
		node.style.marginRight = '0';
		node.style.marginLeft = 'auto';
	} else {
		node.style.margin = 'auto';
	}
}



editor.addEventListener('keydown', function(e) {
	if (e.key === 'Tab') {
		e.preventDefault();
		currentAreaIdx = (currentAreaIdx + 1) % AREAS.length;
		updateAreaIndicator();
		setTimeout(formatCurrentLine, 0);
	} else if (e.key === 'Enter') {
		// On Enter, keep current line's area, but set next line to LOCATION
		setTimeout(() => {
			currentAreaIdx = 0;
			updateAreaIndicator();
		}, 0);
		setTimeout(formatCurrentLine, 0);
	}
});

editor.addEventListener('input', function(e) {
	// On paste or typing, ensure new lines are wrapped in divs
	const lines = editor.innerHTML.split(/<div[^>]*>|<br>/g).filter(Boolean);
	if (lines.length > 1) {
		// Re-wrap all lines in divs
		let areaIdx = 0;
		let html = '';
		for (let i = 0; i < lines.length; i++) {
			let line = lines[i].replace(/<[^>]+>/g, '');
			const area = AREAS[areaIdx];
			let text = area.caps ? line.toUpperCase() : line;
			let style = `display:block;text-align:${area.align};width:${area.width};margin:auto;white-space:pre-wrap;`;
			if (area.align === 'left') style += 'margin-left:0;margin-right:auto;';
			if (area.align === 'right') style += 'margin-right:0;margin-left:auto;';
			html += `<div class="script-line" data-area="${area.name}" style="${style}">${text || '<br>'}</div>`;
			areaIdx = inferNextAreaIdx(areaIdx, line);
		}
		editor.innerHTML = html;
	}
});

// Initial setup
updateAreaIndicator();
// Insert first line div
if (editor.innerHTML.trim() === '') {
	editor.innerHTML = '<div class="script-line" data-area="LOCATION" style="display:block;text-align:left;width:100%;margin-left:0;margin-right:auto;white-space:pre-wrap;">&nbsp;</div>';
}
