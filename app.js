const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz76qW_v1mZW-fyLYsuj84CdrK-CH5u_6_KIAj6iPuTkUWRfIRuoDUow8HT-QQ6hgxc/exec"; 

let mode = 'AGENT';
let recognition;
let isListening = false;

// FORSOWANIE MĘSKIEGO GŁOSU
function speak(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    // Szukamy specyficznych męskich głosów dostępnych w Android/Chrome
    let maleVoice = voices.find(v => v.lang.includes('pl') && (v.name.includes('Male') || v.name.includes('Męski') || v.name.includes('Standard-B')));
    if (!maleVoice) maleVoice = voices.find(v => v.lang.includes('pl'));
    
    u.voice = maleVoice;
    u.pitch = 0.7; // Bardzo niski ton
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }
}

// MIKROFON - INICJALIZACJA PRZY KLIKNIĘCIU (wymóg mobilny)
function initMic() {
  if (recognition) return;
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Speech) return alert("Twoja przeglądarka nie obsługuje mikrofonu. Użyj Chrome.");
  
  recognition = new Speech();
  recognition.lang = 'pl-PL';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (e) => {
    let transcript = '';
    for (let i = e.resultIndex; i < e.results.length; ++i) {
      if (e.results[i].isFinal) transcript += e.results[i][0].transcript;
    }
    if (transcript) {
      document.getElementById('cmd').value += transcript + " ";
    }
  };
  
  recognition.onerror = (err) => {
    console.error(err);
    isListening = false;
    document.getElementById('micBtn').classList.remove('active');
  };
}

async function handleMic() {
  initMic();
  if (!isListening) {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      recognition.start();
      isListening = true;
      document.getElementById('micBtn').classList.add('active');
      document.getElementById('status').innerText = "SŁUCHAM...";
    } catch(e) { alert("Brak uprawnień do mikrofonu."); }
  } else {
    recognition.stop();
    isListening = false;
    document.getElementById('micBtn').classList.remove('active');
    document.getElementById('status').innerText = "KONOPEK";
  }
}

// POBIERANIE LISTY (Z OBSŁUGĄ BŁĘDÓW)
async function fetchTasks() {
  const list = document.getElementById('taskList');
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getTasks&tryb=${mode}`, { method: 'GET' });
    const tasks = await res.json();
    list.innerHTML = '';
    if (tasks.length === 0) {
      list.innerHTML = '<div style="text-align:center; opacity:0.3; font-size:10px;">BRAK ZADAŃ</div>';
    } else {
      tasks.forEach(t => {
        list.innerHTML += `<div class="task-item"><span class="task-status">${t.status}</span>${t.polecenie}</div>`;
      });
    }
  } catch (e) {
    list.innerHTML = '<div style="text-align:center; opacity:0.3; font-size:10px;">ŁĄCZENIE Z ARKUSZEM...</div>';
  }
}

function send() {
  const val = document.getElementById('cmd').value;
  const deadline = document.getElementById('deadlineInput').value;
  if (!val) return;
  
  document.getElementById('status').innerText = "WYSYŁANIE...";
  
  fetch(SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({ polecenie: val, tryb: mode, deadline: deadline })
  }).then(() => {
    speak("Przyjęte");
    document.getElementById('cmd').value = "";
    document.getElementById('status').innerText = "ZAPISANO";
    setTimeout(() => { 
      document.getElementById('status').innerText = "KONOPEK";
      fetchTasks(); 
    }, 1000);
  });
}

function setMode(m) {
  mode = m;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('t-' + m).classList.add('active');
  document.getElementById('deadlineInput').style.display = (m === 'JA') ? 'block' : 'none';
  speak("Sekcja " + (m === 'AGENT' ? 'Zespół' : (m === 'JA' ? 'Szef' : 'Pomysł')));
  fetchTasks();
}

// WYMUSZENIE GŁOSÓW I LISTY PRZY STARCIE
window.onload = () => {
  window.speechSynthesis.getVoices();
  setTimeout(fetchTasks, 2000);
};
