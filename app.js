const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz76qW_v1mZW-fyLYsuj84CdrK-CH5u_6_KIAj6iPuTkUWRfIRuoDUow8HT-QQ6hgxc/exec"; 

let mode = 'AGENT';
let recognition;
let isListening = false;

// ŻEŃSKA FORMA WYPOWIEDZI
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

// NAPRAWIONY MIKROFON - SPECJALNIE POD TELEFONY
if ('webkitSpeechRecognition' in window || 'speechRecognition' in window) {
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new Speech();
  recognition.lang = 'pl-PL';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
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
      document.getElementById('cmd').value += finalTranscript + " ";
    }
  };

  recognition.onerror = (event) => {
    console.error("Błąd mikrofonu:", event.error);
    if (event.error === 'not-allowed') alert("Musisz zezwolić na mikrofon w ustawieniach strony!");
    stopMic();
  };

  recognition.onend = () => {
    if (isListening) recognition.start(); // Automatyczny restart jeśli przerwie
  };
}

function stopMic() {
  recognition.stop();
  isListening = false;
  document.getElementById('micBtn').classList.remove('active');
  document.getElementById('status').innerText = "KONOPEK";
}

async function handleMic() {
  if (!isListening) {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      recognition.start();
      isListening = true;
      document.getElementById('micBtn').classList.add('active');
      document.getElementById('status').innerText = "SŁUCHAM CIĘ...";
    } catch(e) { 
      alert("Brak dostępu do mikrofonu!"); 
    }
  } else {
    stopMic();
  }
}

// POBIERANIE LISTY Z KOLORAMI STATUSÓW
async function fetchTasks() {
  const list = document.getElementById('taskList');
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getTasks&tryb=${mode}&t=${new Date().getTime()}`);
    const tasks = await res.json();
    list.innerHTML = '';
    
    tasks.forEach(t => {
      const statusText = t.status ? t.status.toUpperCase() : "OCZEKUJE";
      // Tworzymy element z atrybutem data-status dla CSS
      const taskHtml = `
        <div class="task-item" data-status="${statusText}">
          <span class="task-status">${statusText}</span>
          ${t.polecenie}
        </div>`;
      list.innerHTML += taskHtml;
    });
  } catch (e) {
    list.innerHTML = '<div style="text-align:center; opacity:0.3; font-size:10px;">POBIERAM DANE...</div>';
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
    speak("Przyjęłam zadanie i zapisałam je w Twoim arkuszu."); 
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
  
  const msg = (m === 'AGENT') ? "Zmieniłam sekcję na zespół." : (m === 'JA' ? "Jestem w Twoim kalendarzu." : "Słucham Twojego pomysłu.");
  speak(msg);
  fetchTasks();
}

window.onload = () => { setTimeout(fetchTasks, 1500); };
