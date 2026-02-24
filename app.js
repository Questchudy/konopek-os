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

// INICJALIZACJA MIKROFONU - WERSJA MOBILE-FIRST
const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
if (Speech) {
  recognition = new Speech();
  recognition.lang = 'pl-PL';
  recognition.continuous = true;
  recognition.interimResults = true; // KLUCZOWE: Widzimy tekst od razu

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

    const area = document.getElementById('cmd');
    if (finalTranscript) {
      area.value += finalTranscript.trim() + " ";
      area.scrollTop = area.scrollHeight;
    }
    // Na mobile interimTranscript pomaga "popychać" procesor mowy
    console.log("Słyszę:", interimTranscript);
  };

  recognition.onerror = (err) => {
    console.error("Błąd:", err.error);
    if (err.error === 'network') alert("Brak internetu do obsługi mowy!");
    if (err.error === 'not-allowed') alert("Zezwól na mikrofon w ustawieniach telefonu!");
  };

  recognition.onend = () => {
    if (isListening) {
      try { recognition.start(); } catch(e) {}
    }
  };
}

function stopMic() {
  isListening = false;
  if (recognition) recognition.stop();
  document.getElementById('micBtn').classList.remove('active');
  document.getElementById('status').innerText = "KONOPEK";
}

async function handleMic() {
  if (!isListening) {
    try {
      // WAŻNE DLA MOBILE: Najpierw prosimy o dostęp, potem odpalamy silnik
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      isListening = true;
      recognition.start();
      document.getElementById('micBtn').classList.add('active');
      document.getElementById('status').innerText = "SŁUCHAM...";
    } catch(e) {
      alert("Błąd dostępu do mikrofonu!");
      isListening = false;
    }
  } else {
    stopMic();
  }
}

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
