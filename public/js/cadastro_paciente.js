// Simular dados de autenticação para exemplo
const authData = {
    dados: {
        hospitalId: 1 // Ajuste conforme seu sistema
    }
};

// Menu e dropdown
function toggleDropdown() {
    const dropdown = document.getElementById('dropdown-content');
    if (dropdown) dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function toggleMenu() {
    const nav = document.getElementById('nav-buttons');
    nav.classList.toggle('show');
}

window.onclick = function(event) {
    if (!event.target.matches('nav button')) {
        const dropdown = document.getElementById('dropdown-content');
        if (dropdown && dropdown.style.display === 'block') {
            dropdown.style.display = 'none';
        }
    }
}

// Ocultar loading inicial após carregamento
window.addEventListener('load', function() {
    setTimeout(function() {
        const loading = document.getElementById('loading-screen');
        if (loading) loading.style.opacity = '0';
        setTimeout(function() {
            if (loading) loading.style.display = 'none';
        }, 500);
    }, 1000);
});

// Submit do formulário
document.getElementById('paciente-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const nome = document.getElementById('nome').value;
    const idade = parseInt(document.getElementById('idade').value);
    const sexo = document.getElementById('sexo').value;
    const nivelalerta = document.getElementById('nivel-alerta').value;
    const relatorio = document.getElementById('relatorio').value;
    const prescricao = document.getElementById('prescricao').value;
    const estadia = parseInt(document.getElementById('estadia').value);
    const quarto = parseInt(document.getElementById('quarto').value);
    const hospitalId = authData.dados.hospitalId;

    if (isNaN(estadia) || estadia <= 1) {
        showAlert('A estadia deve ser maior que 1 dia.');
        return;
    }

    try {
        const response = await fetch('/api/pacientes/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome,
                idade,
                sexo,
                nivelalerta,
                relatorio,
                prescricao,
                estadia,
                quarto,
                hospitalId
            })
        });

        if (response.ok) {
            showAlert('Paciente cadastrado com sucesso!');
            e.target.reset();
        } else {
            const erro = await response.json();
            showAlert('Erro ao cadastrar paciente: ' + erro.error);
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

