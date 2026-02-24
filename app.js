const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz76qW_v1mZW-fyLYsuj84CdrK-CH5u_6_KIAj6iPuTkUWRfIRuoDUow8HT-QQ6hgxc/exec"; 

let mode = 'AGENT';
let recognition = null;
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

// FUNKCJA STARTUJĄCA MIKROFON - STWORZONA POD ANDROIDA
async function handleMic() {
  const btn = document.getElementById('micBtn');
  const area = document.getElementById('cmd');

  if (!isListening) {
    try {
      // 1. Prośba o dostęp do sprzętu (wymuszenie na systemie)
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // 2. Inicjalizacja silnika Web Speech
      const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Speech) {
        alert("Twoja przeglądarka nie wspiera mowy.");
        return;
      }

      recognition = new Speech();
      recognition.lang = 'pl-PL';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        isListening = true;
        btn.classList.add('active');
        document.getElementById('status').innerText = "SŁUCHAM...";
        if (navigator.vibrate) navigator.vibrate(50); // Krótka wibracja na start
      };

      recognition.onresult = (event) => {
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          }
        }
        if (final) {
          area.value += final.trim() + " ";
          area.scrollTop = area.scrollHeight;
          // Wymuszamy na Androidzie odświeżenie pola
          area.dispatchEvent(new Event('input', { bubbles: true }));
        }
      };

      recognition.onerror = (e) => {
        console.error("Błąd mowy:", e.error);
        stopMic();
      };

      recognition.onend = () => {
        if (isListening) recognition.start(); // Auto-restart przy ciszy
      };

      recognition.start();

    } catch (err) {
      alert("Błąd: System odrzucił dostęp do mikrofonu.");
      console.error(err);
    }
  } else {
    stopMic();
  }
}

function stopMic() {
  isListening = false;
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
  document.getElementById('micBtn').classList.remove('active');
  document.getElementById('status').innerText = "KONOPEK";
}

// POBIERANIE LISTY ZADAŃ
async function fetchTasks() {
  const list = document.getElementById('taskList');
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getTasks&tryb=${mode}&t=${new Date().getTime()}`);
    const tasks = await res.json();
    list.innerHTML = '';
    tasks.forEach(t => {
      const statusText = (t.status || "OCZEKUJE").toUpperCase();
      list.innerHTML += `
        <div class="task-item" data-status="${statusText}">
          <span class="task-status">${statusText}</span>
          ${t.polecenie}
        </div>`;
    });
  } catch (e) {
    list.innerHTML = '<div style="text-align:center; opacity:0.2;">...</div>';
  }
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
  speak(m === 'AGENT' ? "Zespół" : (m === 'JA' ? "Szef" : "Pomysł"));
  fetchTasks();
}

window.onload = () => { 
  setTimeout(fetchTasks, 1000); 
};
