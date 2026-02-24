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

// OSTATECZNIE POPRAWIONY MIKROFON
const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;

if (Speech) {
  recognition = new Speech();
  recognition.lang = 'pl-PL';
  recognition.continuous = true;
  recognition.interimResults = true; // Zostawiamy true, ale zmieniamy sposób zapisu

  recognition.onresult = (event) => {
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      }
    }
    
    // Kluczowa poprawka: dopisujemy tylko sfinalizowany tekst do pola tekstowego
    if (finalTranscript) {
      const area = document.getElementById('cmd');
      area.value += finalTranscript.trim() + " ";
      area.scrollTop = area.scrollHeight; // Auto-scroll
    }
  };

  recognition.onerror = (event) => {
    console.error("Błąd rozpoznawania:", event.error);
    if (event.error === 'not-allowed') alert("Zezwól na mikrofon w ustawieniach przeglądarki!");
    stopMic();
  };

  recognition.onend = () => {
    // Jeśli isListening nadal jest true, a system przerwał (cisza), restartujemy
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
      // Wymuszamy zapytanie o uprawnienia
      await navigator.mediaDevices.getUserMedia({ audio: true });
      isListening = true;
      recognition.start();
      document.getElementById('micBtn').classList.add('active');
      document.getElementById('status').innerText = "SŁUCHAM CIĘ...";
    } catch(e) {
      alert("Brak dostępu do mikrofonu!");
      isListening = false;
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
      const taskHtml = `
        <div class="task-item" data-status="${statusText}">
          <span class="task-status">${statusText}</span>
          ${t.polecenie}
        </div>`;
      list.innerHTML += taskHtml;
    });
  } catch (e) {
    console.error("Błąd pobierania:", e);
    list.innerHTML = '<div style="text-align:center; opacity:0.3; font-size:10px;">ŁĄCZENIE Z ARKUSZEM...</div>';
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
