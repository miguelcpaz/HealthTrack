// 🔐 Recupera dados de autenticação
const authData = JSON.parse(localStorage.getItem('auth')) || JSON.parse(sessionStorage.getItem('auth'));

if (!authData) {
    showAlert('Usuário não autenticado!', () => {window.location.href = "/login";});
    
}

// 👁️ Alternar visibilidade das senhas
document.querySelectorAll(".toggle-password").forEach(icon => {
    icon.addEventListener("click", () => {
        const targetId = icon.getAttribute("data-target");
        const input = document.getElementById(targetId);

        if (input.type === "password") {
            input.type = "text";
            icon.classList.replace("ri-eye-off-line", "ri-eye-line");
        } else {
            input.type = "password";
            icon.classList.replace("ri-eye-line", "ri-eye-off-line");
        }
    });
});

// 📤 Envio do formulário
const form = document.getElementById("change-password-form");

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (newPassword !== confirmPassword) {
        showAlert("As senhas não coincidem!", () => {return;});
        
    }

    const data = { newPassword };

    try {
        const urlBase = `/api/auth/change-temp-password/${authData.dados.email}`;
        const response = await fetch(urlBase, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            showAlert(result.message);

            // Atualiza o auth nos storages se vier atualizado
            if (result.authAtualizado) {
                localStorage.setItem('auth', JSON.stringify(result.authAtualizado));
                sessionStorage.setItem('auth', JSON.stringify(result.authAtualizado));
            }

            window.location.href = "/";
        } else {
            showAlert(result.error || "Erro ao atualizar a senha.");
        }
    } catch (error) {
        showAlert('Erro ao tentar atualizar a senha.');
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

