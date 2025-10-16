// Mostrar/ocultar senha
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

// Lógica de login
const form = document.getElementById("loginForm");
form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  const remember = document.getElementById("remember").checked;

  const data = { email, senha };

  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.status === 200) {
      const authData = {
        tipo: result.tipo,
        dados: result.dados
      };

      if (remember) {
        localStorage.setItem('auth', JSON.stringify(authData));
      } else {
        sessionStorage.setItem('auth', JSON.stringify(authData));
      }

      alert(result.message);

      if (authData.dados.status_senha === 1) {
        window.location.href = "senha_temporaria.html";
      } else {
        window.location.href = "index.html";
      }
    } else {
      alert(result.error);
    }
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    alert('Erro ao tentar fazer login.');
  }
});

// Tela de carregamento
window.addEventListener('load', function () {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    const randomDelay = Math.floor(Math.random() * (2500 - 1000 + 1)) + 1000;
    setTimeout(() => {
      loadingScreen.style.opacity = '0';
      setTimeout(() => loadingScreen.style.display = 'none', 500);
    }, randomDelay);
  }
});
