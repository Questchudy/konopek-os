const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz76qW_v1mZW-fyLYsuj84CdrK-CH5u_6_KIAj6iPuTkUWRfIRuoDUow8HT-QQ6hgxc/exec"; 

let mode = 'AGENT';
let recognition;
let isListening = false;

function speak(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pl-PL';
    u.pitch = 1.0; 
    u.rate = 1.0;
    window.speechSynthesis.speak(u);
  }
}

// NAPRAWA MIKROFONU
if ('webkitSpeechRecognition' in window || 'speechRecognition' in window) {
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new Speech();
  recognition.lang = 'pl-PL';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (e) => {
    let text = '';
    for (let i = e.resultIndex; i < e.results.length; ++i) {
      if (e.results[i].isFinal) text += e.results[i][0].transcript;
    }
    if (text) {
      document.getElementById('cmd').value += text + " ";
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
    } catch(e) { alert("Brak dostępu do mikrofonu!"); }
  } else {
    recognition.stop();
    isListening = false;
    document.getElementById('micBtn').classList.remove('active');
    document.getElementById('status').innerText = "KONOPEK";
  }
}

async function fetchTasks() {
  const list = document.getElementById('taskList');
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getTasks&tryb=${mode}`);
    const tasks = await res.json();
    list.innerHTML = '';
    tasks.forEach(t => {
      list.innerHTML += `<div class="task-item"><span class="task-status">${t.status}</span>${t.polecenie}</div>`;
    });
  } catch (e) {
    list.innerHTML = '<div style="text-align:center; opacity:0.3; font-size:10px;">POBIERAM DANE...</div>';
  }
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
    speak("Przyjęłam zadanie i zapisałam w arkuszu."); // RODZAJ ŻEŃSKI
    document.getElementById('cmd').value = "";
    document.getElementById('status').innerText = "ZAPISANO";
    setTimeout(() => { 
      document.getElementById('status').innerText = "KONOPEK";
      fetchTasks(); 
    }, 1500);
  });
}

function setMode(m) {
  mode = m;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('t-' + m).classList.add('active');
  document.getElementById('deadlineInput').style.display = (m === 'JA') ? 'block' : 'none';
  
  // RODZAJ ŻEŃSKI
  const msg = (m === 'AGENT') ? "Przełączyłam na tryb zespołu." : (m === 'JA' ? "Jestem w trybie szefa." : "Zapamiętam Twój pomysł.");
  speak(msg);
  fetchTasks();
}

window.onload = () => { setTimeout(fetchTasks, 1500); };
