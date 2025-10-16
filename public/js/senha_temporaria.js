// 🔐 Recupera dados de autenticação
const authData = JSON.parse(localStorage.getItem('auth')) || JSON.parse(sessionStorage.getItem('auth'));

if (!authData) {
    alert('Usuário não autenticado!');
    window.location.href = "http://localhost:3000/login";
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
        alert("As senhas não coincidem!");
        return;
    }

    const data = { newPassword };

    try {
        const urlBase = `http://localhost:3000/api/auth/change-temp-password/${authData.dados.email}`;
        const response = await fetch(urlBase, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);

            // Atualiza o auth nos storages se vier atualizado
            if (result.authAtualizado) {
                localStorage.setItem('auth', JSON.stringify(result.authAtualizado));
                sessionStorage.setItem('auth', JSON.stringify(result.authAtualizado));
            }

            window.location.href = "http://localhost:3000";
        } else {
            alert(result.error || "Erro ao atualizar a senha.");
        }
    } catch (error) {
        console.error('Erro ao atualizar senha:', error);
        alert('Erro ao tentar atualizar a senha.');
    }
});
