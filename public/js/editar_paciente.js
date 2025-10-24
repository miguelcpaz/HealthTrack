// === Tema (modo claro/escuro) ===
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-mode');
}

function setDarkMode() {
  document.body.classList.add('dark-mode');
  localStorage.setItem('theme', 'dark');
}

function setLightMode() {
  document.body.classList.remove('dark-mode');
  localStorage.setItem('theme', 'light');
}

// === Menu e dropdown ===
function toggleDropdown() {
  const dropdown = document.getElementById('dropdown-content');
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function toggleMenu() {
  const nav = document.getElementById('nav-buttons');
  nav.classList.toggle('show');
}

window.onclick = function (event) {
  if (!event.target.matches('nav button')) {
    const dropdown = document.getElementById('dropdown-content');
    if (dropdown && dropdown.style.display === 'block') {
      dropdown.style.display = 'none';
    }
  }
};

// === Loading inicial ===
window.addEventListener('load', function () {
  setTimeout(function () {
    const screen = document.getElementById('loading-screen');
    if (screen) {
      screen.style.opacity = '0';
      setTimeout(() => (screen.style.display = 'none'), 500);
    }
  }, 1000);
});

// === Preencher formulário com dados salvos ===
const paciente = JSON.parse(localStorage.getItem('pacienteSelecionado'));

if (paciente) {
  document.getElementById('nome').value = paciente.nome || '';
  document.getElementById('idade').value = paciente.idade || '';
  document.getElementById('sexo').value = paciente.sexo || '';
  document.getElementById('nivel-alerta').value = paciente.nivelalerta || '';
  document.getElementById('relatorio').value = paciente.relatorio || '';
  document.getElementById('prescricao').value = paciente.prescricao || '';
  document.getElementById('estadia').value = paciente.estadia || '';
  document.getElementById('quarto').value = paciente.quarto || '';
}

// === Atualizar paciente ===
document.getElementById('form-editar-paciente').addEventListener('submit', async function (e) {
  e.preventDefault();

  const nome = document.getElementById('nome').value;
  const idade = parseInt(document.getElementById('idade').value);
  const sexo = document.getElementById('sexo').value;
  const nivelalerta = document.getElementById('nivel-alerta').value;
  const relatorio = document.getElementById('relatorio').value;
  const prescricao = document.getElementById('prescricao').value;
  const estadia = parseInt(document.getElementById('estadia').value);
  const quarto = parseInt(document.getElementById('quarto').value);
  const id = paciente.id;

  if (isNaN(estadia) || estadia <= 1) {
    showAlert('A estadia deve ser maior que 1 dia.');
    return;
  }

  try {
    const response = await fetch(`/api/pacientes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        nome,
        idade,
        sexo,
        nivelalerta,
        relatorio,
        prescricao,
        estadia,
        quarto,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      showAlert('Paciente editado com sucesso!');
      localStorage.removeItem('pacienteSelecionado');

      const pacienteAtualizado = {
        id,
        nome,
        idade,
        sexo,
        nivelalerta,
        relatorio,
        prescricao,
        estadia,
        quarto,
      };

      localStorage.setItem('pacienteSelecionado', JSON.stringify(pacienteAtualizado));
      window.location.href = 'paciente.html';
      e.target.reset();
    } else {
      showAlert('Erro ao editar paciente: ' + (data.error || 'Erro desconhecido'));
    }
  } catch (err) {
    console.error(err);
    showAlert('Erro na comunicação com o servidor.');
  }
});

function showAlert(message = "", onConfirm = null) {
  if (!message) return;

  const alertBox = document.getElementById("custom-alert");
  const alertMessage = document.getElementById("alert-message");
  const alertOk = document.getElementById("alert-ok");

  alertMessage.textContent = message;
  alertBox.style.display = "flex";

  // Remove event listeners antigos (para evitar duplicação)
  const newOkButton = alertOk.cloneNode(true);
  alertOk.parentNode.replaceChild(newOkButton, alertOk);

  // Adiciona novo evento
  newOkButton.addEventListener("click", () => {
    alertBox.style.display = "none";
    if (typeof onConfirm === "function") {
      onConfirm(); // executa o callback, se existir
    }
  });
}

