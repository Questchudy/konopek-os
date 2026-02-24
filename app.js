const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz76qW_v1mZW-fyLYsuj84CdrK-CH5u_6_KIAj6iPuTkUWRfIRuoDUow8HT-QQ6hgxc/exec"; 

let mode = 'AGENT';
let recognition;
let isListening = false;
let audioContext; // Dodatkowe wymuszenie dla Androida

function speak(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pl-PL';
    u.pitch = 1.1; 
    u.rate = 1.0;
    window.speechSynthesis.speak(u);
  }
}

// GŁÓWNA KONFIGURACJA MIKROFONU
const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
if (Speech) {
  recognition = new Speech();
  recognition.lang = 'pl-PL';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    const area = document.getElementById('cmd');
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      }
    }

    if (finalTranscript) {
      area.value += finalTranscript.trim() + " ";
      area.scrollTop = area.scrollHeight;
      console.log("Rozpoznano:", finalTranscript);
    }
  };

  recognition.onstart = () => {
    document.getElementById('status').innerText = "SŁUCHAM...";
    document.getElementById('micBtn').classList.add('active');
  };

  recognition.onerror = (err) => {
    console.error("Błąd API:", err.error);
    if (err.error === 'no-speech') return; 
    stopMic();
  };

  recognition.onend = () => {
    if (isListening) {
      try { recognition.start(); } catch(e) {}
    }
  };
}

// TA FUNKCJA TO KLUCZ DO ANDROIDA
async function handleMic() {
  if (!isListening) {
    try {
      // 1. Wymuszamy start kontekstu audio (budzimy kartę dźwiękową)
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // 2. Pobieramy strumień (fizyczne otwarcie mikrofonu)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 3. Startujemy właściwe rozpoznawanie
      isListening = true;
      recognition.start();
      
      if (navigator.vibrate) navigator.vibrate(50);
    } catch(e) {
      alert("System Android zablokował mikrofon. Sprawdź kłódkę w Chrome.");
      console.error(e);
    }
  } else {
    stopMic();
  }
}

function stopMic() {
  isListening = false;
  if (recognition) recognition.stop();
  document.getElementById('micBtn').classList.remove('active');
  document.getElementById('status').innerText = "KONOPEK";
}

// POBIERANIE LISTY
async function fetchTasks() {
  const list = document.getElementById('taskList');
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getTasks&tryb=${mode}&t=${new Date().getTime()}`);
    const tasks = await res.json();
    if (list) {
        list.innerHTML = '';
        tasks.forEach(t => {
          const statusText = (t.status || "OCZEKUJE").toUpperCase();
          list.innerHTML += `<div class="task-item" data-status="${statusText}"><span class="task-status">${statusText}</span>${t.polecenie}</div>`;
        });
    }
  } catch (e) { if(list) list.innerHTML = ''; }
}

function send() {
  const area = document.getElementById('cmd');
  const val = area.value;
  const deadline = document.getElementById('deadlineInput').value;
  if (!val) return;
  document.getElementById('status').innerText = "WYSYŁAM...";
  fetch(SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({ polecenie: val, tryb: mode, deadline: deadline })
  }).then(() => {
    speak("Przyjęłam.");
    area.value = "";
    document.getElementById('status').innerText = "ZAPISANO";
    setTimeout(() => { document.getElementById('status').innerText = "KONOPEK"; fetchTasks(); }, 1000);
  });
}

function setMode(m) {
  mode = m;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('t-' + m).classList.add('active');
  document.getElementById('deadlineInput').style.display = (m === 'JA') ? 'block' : 'none';
  speak(m === 'AGENT' ? "Zespół" : (m === 'JA' ? "Szef" : "Pomysł"));
  fetchTasks();
}

window.onload = () => { setTimeout(fetchTasks, 1000); };
