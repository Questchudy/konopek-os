const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz76qW_v1mZW-fyLYsuj84CdrK-CH5u_6_KIAj6iPuTkUWRfIRuoDUow8HT-QQ6hgxc/exec"; 

let mode = 'AGENT';
let recognition;
let isListening = false;

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

// INICJALIZACJA MIKROFONU
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
      // Używamy insertText lub prostego dodawania, aby nie blokować kursora
      area.value += finalTranscript.trim() + " ";
      area.scrollTop = area.scrollHeight;
    }
  };

  recognition.onstart = () => { document.getElementById('status').innerText = "SŁUCHAM..."; };
  recognition.onerror = (err) => { console.error("Błąd:", err.error); stopMic(); };
  recognition.onend = () => { if (isListening) recognition.start(); };
}

async function handleMic() {
  if (!isListening) {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      isListening = true;
      recognition.start();
      document.getElementById('micBtn').classList.add('active');
    } catch(e) { alert("Brak dostępu do mikrofonu!"); }
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
    list.innerHTML = '';
    tasks.forEach(t => {
      const statusText = t.status ? t.status.toUpperCase() : "OCZEKUJE";
      list.innerHTML += `<div class="task-item" data-status="${statusText}"><span class="task-status">${statusText}</span>${t.polecenie}</div>`;
    });
  } catch (e) { list.innerHTML = '...'; }
}

function send() {
  const val = document.getElementById('cmd').value;
  const deadline = document.getElementById('deadlineInput').value;
  if (!val) return;
  
  document.getElementById('status').innerText = "WYSYŁAM...";
  fetch(SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({ polecenie: val, tryb: mode, deadline: deadline })
  }).then(() => {
    speak("Przyjęłam.");
    document.getElementById('cmd').value = "";
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
