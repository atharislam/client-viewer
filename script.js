// --- 1. INCORPORATED SCRIPTS ---
const SCRIPTS = {
    1: "Welcome to the presentation. In this first section, we will cover the core objectives of our project and the initial research findings.",
    2: "Moving on to the technical architecture. Here you can see how our API integrates with the frontend to deliver real-time data.",
    3: "To conclude, we look at the project timeline and the next steps for deployment. Thank you for your attention!"
};

// --- 2. INITIALIZATION ---
const PDF_URL = 'yourfile.pdf'; 
let pdfDoc = null, pageNum = 1, synth = window.speechSynthesis, currentUtterance = null;
let voices = [];

const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

async function init() {
    pdfDoc = await pdfjsLib.getDocument(PDF_URL).promise;
    document.getElementById('total-pages').textContent = pdfDoc.numPages;
    renderPage(pageNum);
    setupVoices();
}

// --- 3. RESPONSIVE RENDERING ---
async function renderPage(num) {
    const page = await pdfDoc.getPage(num);
    const canvas = document.getElementById('pdf-canvas');
    const ctx = canvas.getContext('2d');
    const wrapper = document.getElementById('viewer-wrapper');

    // Calculate scale to fit the width perfectly without cutting
    const unscaledViewport = page.getViewport({ scale: 1 });
    const scale = (wrapper.clientWidth - 40) / unscaledViewport.width;
    const viewport = page.getViewport({ scale: Math.min(scale, 1.3) });

    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: ctx, viewport }).promise;

    document.getElementById('current-page').textContent = num;
    prepareOverlay(num);
}

function prepareOverlay(num) {
    const overlay = document.getElementById('script-overlay');
    const text = SCRIPTS[num] || "No script for this page.";
    overlay.innerHTML = text.split(' ').map(w => `<span class="word-span">${w}</span>`).join(' ');
}

// --- 4. AUDIO LOGIC ---
function setupVoices() {
    voices = synth.getVoices();
    const select = document.getElementById('voice-select');
    select.innerHTML = voices.map((v, i) => `<option value="${i}">${v.name}</option>`).join('');
}
if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = setupVoices;

function toggleSpeech() {
    if (synth.speaking && !synth.paused) { synth.pause(); }
    else if (synth.paused) { synth.resume(); }
    else { startSpeech(); }
}

function startSpeech() {
    synth.cancel();
    const text = SCRIPTS[pageNum] || "";
    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.voice = voices[document.getElementById('voice-select').value];

    const spans = document.querySelectorAll('.word-span');
    const bubble = document.getElementById('speech-bubble');
    let wordIdx = 0;

    document.getElementById('agent-container').classList.add('speaking');
    bubble.classList.add('active');

    currentUtterance.onboundary = (e) => {
        if (e.name === 'word') {
            spans.forEach(s => s.classList.remove('word-active'));
            if (spans[wordIdx]) {
                spans[wordIdx].classList.add('word-active');
                bubble.textContent = text.split(' ')[wordIdx];
                wordIdx++;
            }
        }
    };

    currentUtterance.onend = () => {
        document.getElementById('agent-container').classList.remove('speaking');
        bubble.classList.remove('active');
    };

    synth.speak(currentUtterance);
}

function changePage(delta) {
    let newPage = pageNum + delta;
    if (newPage >= 1 && newPage <= pdfDoc.numPages) {
        synth.cancel(); pageNum = newPage; renderPage(pageNum);
    }
}

init();