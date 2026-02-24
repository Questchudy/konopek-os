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
  
  // KLUCZOWA ZMIANA POD ANDROIDA:
  recognition.continuous = false; 
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    const area = document.getElementById('cmd');
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (finalTranscript) {
      area.value += finalTranscript.trim() + " ";
      area.scrollTop = area.scrollHeight;
      if (navigator.vibrate) navigator.vibrate(20); // Delikatny "klik" przy tekście
    }
  };

  recognition.onstart = () => {
    document.getElementById('status').innerText = "SŁUCHAM...";
    document.getElementById('micBtn').classList.add('active');
  };

  recognition.onerror = (err) => {
    console.error("Błąd:", err.error);
    if (err.error !== 'no-speech') stopMic();
  };

  recognition.onend = () => {
    // Na Androidzie continuous:false kończy sesję po zdaniu.
    // Jeśli isListening nadal true, natychmiast odpalamy nową sesję.
    if (isListening) {
      try { recognition.start(); } catch(e) {}
    }
  };
}

async function handleMic() {
  if (!isListening) {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      isListening = true;
      recognition.start();
    } catch(e) {
      alert("Błąd mikrofonu!");
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

// RESZTA FUNKCJI (BEZ ZMIAN)
async function fetchTasks() {
  const list = document.getElementById('taskList');
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getTasks&tryb=${mode}&t=${new Date().getTime()}`);
    const tasks = await res.json();
    list.innerHTML = '';
    tasks.forEach(t => {
      const statusText = (t.status || "OCZEKUJE").toUpperCase();
      list.innerHTML += `<div class="task-item" data-status="${statusText}"><span class="task-status">${statusText}</span>${t.polecenie}</div>`;
    });
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
