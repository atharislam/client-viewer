// Data sourced from Tenectase (yourfile.pdf)
const SCRIPTS = {
    1: "Every 20 seconds, one Indian suffers a brain stroke. Every minute of delay causes 12 million brain cells and 15 billion synapses to die.",
    2: "Recognize reliability with the Tenectase Advantage. We pledge to ensure patients get the right treatment at the right time.",
    3: "Tenectase offers a well-characterized mechanism of action in acute ischemic stroke, featuring 15-fold greater fibrin specificity.",
    4: "Tenectase is the DCGI-approved thrombolytic for Indian patients. Indicated for treatment within 4.5 hours of stroke initiation.",
    11: "Dosage instructions: Withdraw 10 ml sterile water, inject into the Tenectase vial, and gently swirl. Administer as a single IV bolus."
};

const PDF_URL = 'yourfile.pdf'; 
const TRACKING_URL = "PASTE_YOUR_GOOGLE_WEB_APP_URL_HERE"; 

let pdfDoc = null, pageNum = 1, currentScale = 0, synth = window.speechSynthesis, voices = [];
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

async function init() {
    try {
        const loadingTask = pdfjsLib.getDocument(PDF_URL);
        pdfDoc = await loadingTask.promise;
        document.getElementById('total-pages').textContent = pdfDoc.numPages;
        renderPage(pageNum);
        loadVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = loadVoices;
    } catch (e) { console.error("PDF Fail:", e); alert("Ensure 'yourfile.pdf' is in the folder."); }
}

async function renderPage(num) {
    const page = await pdfDoc.getPage(num);
    const canvas = document.getElementById('pdf-canvas');
    const ctx = canvas.getContext('2d');
    const wrapper = document.getElementById('viewer-wrapper');

    const viewport = page.getViewport({ scale: 1 });
    if (currentScale === 0) {
        const sX = wrapper.clientWidth / viewport.width;
        const sY = wrapper.clientHeight / viewport.height;
        currentScale = Math.min(sX, sY) * 0.95; // Fit with slight padding
    }

    const scaledViewport = page.getViewport({ scale: currentScale });
    canvas.height = scaledViewport.height;
    canvas.width = scaledViewport.width;

    await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
    document.getElementById('current-page').textContent = num;
    document.getElementById('zoom-percent').textContent = `${Math.round(currentScale * 100)}%`;
    
    // TRACKING ACTION
    trackPageView(num);
}

function adjustZoom(delta) { currentScale += delta; renderPage(pageNum); }
function resetZoom() { currentScale = 0; renderPage(pageNum); }

function loadVoices() {
    voices = synth.getVoices();
    const select = document.getElementById('voice-select');
    // Prioritize Indian English (en-IN)
    const indianVoices = voices.filter(v => v.lang.includes('en-IN'));
    const sorted = [...indianVoices, ...voices.filter(v => !v.lang.includes('en-IN'))];
    select.innerHTML = sorted.map((v, i) => `<option value="${voices.indexOf(v)}">${v.name}</option>`).join('');
    if (indianVoices.length > 0) select.value = voices.indexOf(indianVoices[0]);
}

function startSpeech() {
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(SCRIPTS[pageNum] || "Refer to document.");
    const vIdx = document.getElementById('voice-select').value;
    if (voices[vIdx]) utterance.voice = voices[vIdx];
    utterance.lang = 'en-IN';
    
    const bubble = document.getElementById('speech-bubble');
    document.getElementById('agent-container').classList.add('speaking');
    bubble.classList.add('active');
    bubble.textContent = "Speaking...";

    utterance.onend = () => {
        document.getElementById('agent-container').classList.remove('speaking');
        bubble.classList.remove('active');
    };
    synth.speak(utterance);
}

function changePage(delta) {
    let target = pageNum + delta;
    if (target >= 1 && target <= pdfDoc.numPages) {
        synth.cancel(); pageNum = target; renderPage(pageNum);
    }
}

async function trackPageView(num) {
    if (TRACKING_URL.includes("PASTE_YOUR")) return;
    fetch(TRACKING_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ page: num, timestamp: new Date().toISOString() })
    });
}

function toggleSpeech() {
    if (synth.speaking && !synth.paused) synth.pause();
    else if (synth.paused) synth.resume();
    else startSpeech();
}

init();