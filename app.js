const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz76qW_v1mZW-fyLYsuj84CdrK-CH5u_6_KIAj6iPuTkUWRfIRuoDUow8HT-QQ6hgxc/exec";
let mode = 'AGENT';
let recognition;
let isListening = false;

// Funkcja odpowiedzi głosowej Konopka
function speak(text) {
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pl-PL';
    u.pitch = 1.1;
    u.rate = 1.0;
    window.speechSynthesis.speak(u);
  }
}

// Konfiguracja mikrofonu
if ('webkitSpeechRecognition' in window || 'speechRecognition' in window) {
  const Speech = window.webkitSpeechRecognition || window.speechRecognition;
  recognition = new Speech();
  recognition.lang = 'pl-PL';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (e) => {
    let t = '';
    for (let i = e.resultIndex; i < e.results.length; ++i) {
      if (e.results[i].isFinal) t += e.results[i][0].transcript;
    }
    if (t) document.getElementById('cmd').value += t + " ";
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
    } catch(e) { 
      alert("Błąd mikrofonu. Sprawdź uprawnienia w przeglądarce."); 
    }
  } else {
    recognition.stop();
    isListening = false;
    document.getElementById('micBtn').classList.remove('active');
    document.getElementById('status').innerText = "KONOPEK OS v7 // GOTOWY";
  }
}

// Wysyłanie do Google Sheets (Mostek)
function send() {
  const val = document.getElementById('cmd').value;
  if (!val) return;
  
  document.getElementById('status').innerText = "WYSYŁANIE DO BAZY...";

  fetch(SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({ polecenie: val, tryb: mode })
  }).then(() => {
    speak("Zlecenie przyjęte, Szefie. Sekcja " + (mode === 'AGENT' ? 'Zespół' : mode));
    document.getElementById('cmd').value = "";
    document.getElementById('status').innerText = "ZAPISANO POMYŚLNIE";
    setTimeout(() => { document.getElementById('status').innerText = "KONOPEK OS v7 // GOTOWY"; }, 2000);
  }).catch(err => {
    alert("Błąd połączenia: " + err);
  });
}

function setMode(m) {
  mode = m;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('t-' + m).classList.add('active');
  speak("Tryb " + (m === 'POMYSL' ? 'Pomysł' : m));
}

// Rejestracja Service Workera (pod powiadomienia i offline)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(() => {
    console.log("Service Worker zarejestrowany.");
  });
}
