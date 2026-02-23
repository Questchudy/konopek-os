const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz76qW_v1mZW-fyLYsuj84CdrK-CH5u_6_KIAj6iPuTkUWRfIRuoDUow8HT-QQ6hgxc/exec"; 

let mode = 'AGENT';
let recognition;
let isListening = false;

// Głos Konopka - ustawiony na bardziej naturalny ton
function speak(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pl-PL';
    u.pitch = 0.9; 
    u.rate = 1.0;
    window.speechSynthesis.speak(u);
  }
}

// Naprawiony mikrofon - tekst pojawia się w polu tekstowym
if ('webkitSpeechRecognition' in window || 'speechRecognition' in window) {
  const Speech = window.webkitSpeechRecognition || window.speechRecognition;
  recognition = new Speech();
  recognition.lang = 'pl-PL';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (e) => {
    let finalTranscript = '';
    for (let i = e.resultIndex; i < e.results.length; ++i) {
      if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
    }
    if (finalTranscript) {
      // Dodaje tekst do okna i automatycznie przewija
      const area = document.getElementById('cmd');
      area.value += finalTranscript + " ";
      area.scrollTop = area.scrollHeight;
    }
  };
}

async function handleMic() {
  if (!isListening) {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      recognition.start();
      isListening = true;
      document.getElementById('micBtn').classList.add('active');
      document.getElementById('status').innerText = "SŁUCHAM...";
    } catch(e) { alert("Daj dostęp do mikrofonu w przeglądarce!"); }
  } else {
    recognition.stop();
    isListening = false;
    document.getElementById('micBtn').classList.remove('active');
    document.getElementById('status').innerText = "KONOPEK GOTOWY";
  }
}

function send() {
  const val = document.getElementById('cmd').value;
  const deadline = document.getElementById('deadlineInput') ? document.getElementById('deadlineInput').value : "";
  
  if (!val) return;
  document.getElementById('status').innerText = "WYSYŁANIE...";

  fetch(SCRIPT_URL, {
    method: "POST",
    mode: "no-cors", // Ważne dla Google Apps Script
    body: JSON.stringify({ 
      polecenie: val, 
      tryb: mode,
      deadline: deadline 
    })
  }).then(() => {
    speak("Przyjęte. Zapisałem w sekcji " + (mode === 'JA' ? 'Szef' : mode));
    document.getElementById('cmd').value = "";
    if(document.getElementById('deadlineInput')) document.getElementById('deadlineInput').value = "";
    document.getElementById('status').innerText = "ZAPISANO POPRAWNIE";
    setTimeout(() => { document.getElementById('status').innerText = "Konopek OS v7"; }, 2500);
  }).catch(err => {
    alert("Błąd: " + err);
  });
}

function setMode(m) {
  mode = m;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('t-' + m).classList.add('active');
  
  const dInput = document.getElementById('deadlineInput');
  if(dInput) dInput.style.display = (m === 'JA') ? 'block' : 'none';
  
  speak("Tryb " + (m === 'POMYSL' ? 'Pomysł' : (m === 'JA' ? 'Szef' : 'Zespół')));
}
