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

// CAŁKOWICIE NOWA KONFIGURACJA POD MOBILE
function initRecognition() {
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Speech) return null;

  const rec = new Speech();
  rec.lang = 'pl-PL';
  rec.continuous = true;
  rec.interimResults = true; // Musi być true na Androidzie, by "popychać" wyniki

  rec.onresult = (event) => {
    let currentText = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        // Dodajemy tylko sfinalizowane fragmenty
        document.getElementById('cmd').value += event.results[i][0].transcript + " ";
      }
    }
  };

  rec.onstart = () => {
    document.getElementById('status').innerText = "SŁUCHAM...";
    console.log("Mikrofon aktywny");
  };

  rec.onerror = (err) => {
    console.error("Błąd mowy:", err.error);
    if (err.error === 'no-speech') return; // Ignoruj ciszę
    stopMic();
  };

  rec.onend = () => {
    if (isListening) {
      try { rec.start(); } catch(e) {}
    }
  };

  return rec;
}

async function handleMic() {
  const area = document.getElementById('cmd');
  const btn = document.getElementById('micBtn');

  if (!isListening) {
    // 1. Inicjalizacja obiektu DOPIERO po kliknięciu
    if (!recognition) recognition = initRecognition();
    
    try {
      // 2. Wymuszamy aktywację kontekstu audio (wymóg mobilny)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      isListening = true;
      btn.classList.add('active');
      recognition.start();
      
      // Krótka wibracja (jeśli telefon wspiera) potwierdzająca start
      if (navigator.vibrate) navigator.vibrate(50);
      
    } catch(e) {
      alert("System zablokował dostęp do mikrofonu.");
      console.error(e);
    }
  } else {
    stopMic();
  }
}

function stopMic() {
  isListening = false;
  if (recognition) {
    recognition.stop();
  }
  document.getElementById('micBtn').classList.remove('active');
  document.getElementById('status').innerText = "KONOPEK";
}

// POBIERANIE LISTY
async function fetchTasks() {
  const list = document.getElementById('taskList');
  if (!list) return;
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getTasks&tryb=${mode}&t=${new Date().getTime()}`);
    const tasks = await res.json();
    list.innerHTML = '';
    if (tasks.length === 0) {
      list.innerHTML = '<div style="text-align:center; opacity:0.3; font-size:10px; padding:20px;">BRAK ZADAŃ</div>';
      return;
    }
    tasks.forEach(t => {
      const statusText = t.status ? t.status.toUpperCase() : "OCZEKUJE";
      list.innerHTML += `<div class="task-item" data-status="${statusText}"><span class="task-status">${statusText}</span>${t.polecenie}</div>`;
    });
  } catch (e) {
    list.innerHTML = '<div style="text-align:center; opacity:0.3; font-size:10px;">ŁĄCZENIE...</div>';
  }
}

function send() {
  const val = document.getElementById('cmd').value;
  const deadline = document.getElementById('deadlineInput').value;
  if (!val) return;
  document.getElementById('status').innerText = "PRZESYŁAM...";
  fetch(SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({ polecenie: val, tryb: mode, deadline: deadline })
  }).then(() => {
    speak("Przyjęłam zadanie."); 
    document.getElementById('cmd').value = "";
    document.getElementById('status').innerText = "ZAPISANO";
    setTimeout(() => { document.getElementById('status').innerText = "KONOPEK"; fetchTasks(); }, 1500);
  });
}

function setMode(m) {
  mode = m;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('t-' + m).classList.add('active');
  document.getElementById('deadlineInput').style.display = (m === 'JA') ? 'block' : 'none';
  speak(m === 'AGENT' ? "Sekcja zespół." : (m === 'JA' ? "Sekcja szef." : "Sekcja pomysł."));
  fetchTasks();
}

window.onload = () => { setTimeout(fetchTasks, 1500); };
