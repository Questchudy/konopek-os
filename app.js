const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz76qW_v1mZW-fyLYsuj84CdrK-CH5u_6_KIAj6iPuTkUWRfIRuoDUow8HT-QQ6hgxc/exec"; 

let mode = 'AGENT';
let recognition;
let isListening = false;

// KONFIGURACJA GŁOSU - MĘSKI I POWAŻNY
function speak(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    // Szukamy najlepszego polskiego głosu
    let v = voices.find(v => v.lang.includes('PL') && v.name.includes('Male')) || 
            voices.find(v => v.lang.includes('PL') && v.name.includes('Google')) ||
            voices.find(v => v.lang.includes('PL'));
    
    u.voice = v;
    u.pitch = 0.75; // Obniżony ton
    u.rate = 0.9;   // Spokojne tempo
    window.speechSynthesis.speak(u);
  }
}

// MIKROFON - POPRAWIONA REAKCJA
if ('webkitSpeechRecognition' in window || 'speechRecognition' in window) {
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new Speech();
  recognition.lang = 'pl-PL';
  recognition.interimResults = true; // Pokazuj tekst w trakcie mówienia
  recognition.continuous = true;

  recognition.onresult = (e) => {
    let final = '';
    for (let i = e.resultIndex; i < e.results.length; ++i) {
      if (e.results[i].isFinal) final += e.results[i][0].transcript;
    }
    if (final) {
      document.getElementById('cmd').value += final + " ";
      // Automatyczne przewijanie w dół
      const area = document.getElementById('cmd');
      area.scrollTop = area.scrollHeight;
    }
  };

  recognition.onerror = (err) => {
    console.error("Błąd rozpoznawania:", err.error);
    isListening = false;
    document.getElementById('micBtn').classList.remove('active');
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
      alert("Brak uprawnień do mikrofonu!");
    }
  } else {
    recognition.stop();
    isListening = false;
    document.getElementById('micBtn').classList.remove('active');
    document.getElementById('status').innerText = "KONOPEK GOTOWY";
  }
}

// POBIERANIE ZADAŃ - NAPRAWIONY ODCZYT
async function fetchTasks() {
  const list = document.getElementById('taskList');
  if (!list) return;

  try {
    // Dodajemy cache-buster, aby Google nie wysyłało starych danych
    const response = await fetch(`${SCRIPT_URL}?action=getTasks&tryb=${mode}&t=${new Date().getTime()}`);
    const tasks = await response.json();
    
    list.innerHTML = '';
    if (tasks.length === 0) {
      list.innerHTML = '<div style="text-align:center; opacity:0.3; font-size:10px; padding:20px;">BRAK AKTYWNYCH ZADAŃ</div>';
      return;
    }

    tasks.forEach(t => {
      list.innerHTML += `<div class="task-item"><span class="task-status">${t.status}</span>${t.polecenie}</div>`;
    });
  } catch (e) {
    console.error("Błąd pobierania zadań:", e);
    list.innerHTML = '<div style="text-align:center; opacity:0.3; font-size:10px; padding:20px;">OCZEKIWANIE NA DANE...</div>';
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
    speak("Przyjąłem.");
    document.getElementById('cmd').value = "";
    document.getElementById('status').innerText = "ZAPISANO";
    setTimeout(() => { 
      document.getElementById('status').innerText = "KONOPEK OS v7";
      fetchTasks(); 
    }, 1500);
  });
}

function setMode(m) {
  mode = m;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('t-' + m).classList.add('active');
  document.getElementById('deadlineInput').style.display = (m === 'JA') ? 'block' : 'none';
  
  speak("Tryb " + (m === 'AGENT' ? 'Zespół' : (m === 'JA' ? 'Szef' : 'Pomysł')));
  fetchTasks();
}

// INICJALIZACJA
window.onload = () => {
  // Wymuszenie załadowania głosów
  window.speechSynthesis.getVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }
  
  setTimeout(fetchTasks, 1000);
};
