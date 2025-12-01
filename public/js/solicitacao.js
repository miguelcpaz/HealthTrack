const authData =
  JSON.parse(localStorage.getItem('auth')) ||
  JSON.parse(sessionStorage.getItem('auth'));

if (!authData || authData.tipo !== 'hospital') {
  window.location.href = 'login.html';
}

async function carregarSolicitacoes() {
  try {
    const resposta = await fetch(
      `/api/solicitacoes/${authData.dados.id}`,
      {
        headers: { Authorization: `Bearer ${authData.token}` },
      }
    );

    const solicitacoes = await resposta.json();

    if (solicitacoes.length === 0) {
      document.getElementById('mensagem').textContent =
        'Nenhuma solicitação pendente.';
      document.getElementById('tabela-container').innerHTML = 
        '<div class="no-requests">Nenhuma solicitação de cadastro pendente</div>';
      return;
    }

    document.getElementById('mensagem').textContent = 
      `${solicitacoes.length} solicitação(ões) pendente(s)`;
    renderizarTabela(solicitacoes);
  } catch (error) {
    console.error('Erro ao carregar solicitações:', error);
    document.getElementById('mensagem').textContent =
      'Erro ao carregar solicitações.';
    document.getElementById('tabela-container').innerHTML = 
      '<div class="no-requests">Erro ao carregar as solicitações</div>';
  }
}

function renderizarTabela(solicitacoes) {
  const container = document.getElementById('tabela-container');

  container.innerHTML = `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Função</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${solicitacoes
            .map(
              (s) => `
            <tr>
              <td data-label="Nome">${s.user.nome}</td>
              <td data-label="Email">${s.user.email}</td>
              <td data-label="Função">${
                s.user.tipo_user === 1
                  ? 'Técnico'
                  : s.user.tipo_user === 2
                  ? 'Enfermeiro'
                  : s.user.tipo_user === 3
                  ? 'Médico'
                  : 'Não definido'
              }</td>
              <td data-label="Ações">
                <div class="action-buttons">
                  <button class="btn btn-aceitar" onclick="aprovarSolicitacao(${s.id}, this)">
                    <i class="ri-check-line"></i> Aprovar
                  </button>
                  <button class="btn btn-recusar" onclick="recusarSolicitacao(${s.id}, this)">
                    <i class="ri-close-line"></i> Recusar
                  </button>
                </div>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;

  // Atualiza a mensagem se todas as solicitações foram processadas
  const linhasRestantes = container.querySelectorAll('tbody tr').length;
  if (linhasRestantes === 0) {
    document.getElementById('mensagem').textContent = 'Nenhuma solicitação pendente.';
    container.innerHTML = '<div class="no-requests">Nenhuma solicitação de cadastro pendente</div>';
  }
}

async function aprovarSolicitacao(id, botao) {
  if (!confirm('Deseja aprovar esta solicitação de cadastro?')) return;

  // Desabilita os botões durante a requisição
  const botoes = botao.closest('.action-buttons').querySelectorAll('button');
  botoes.forEach(btn => btn.disabled = true);
  botao.innerHTML = '<i class="ri-loader-4-line"></i> Processando...';

  try {
    const resposta = await fetch(
      `/api/solicitacoes/${id}/aprovar`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${authData.token}` },
      }
    );

    const resultado = await resposta.json();
    
    if (resposta.ok) {
      showAlert(resultado.message || 'Solicitação aprovada com sucesso!', () => {
        const linha = botao.closest('tr');
        if (linha) {
          linha.style.opacity = '0';
          setTimeout(() => {
            linha.remove();
            atualizarEstadoTabela();
          }, 300);
        }
      });
    } else {
      throw new Error(resultado.message || 'Erro ao aprovar solicitação');
    }
  } catch (error) {
    console.error('Erro ao aprovar:', error);
    showAlert(error.message || 'Erro ao aprovar solicitação.');
    
    // Reabilita os botões em caso de erro
    botoes.forEach(btn => btn.disabled = false);
    botao.innerHTML = '<i class="ri-check-line"></i> Aprovar';
  }
}

async function recusarSolicitacao(id, botao) {
  if (!confirm('Tem certeza que deseja recusar esta solicitação de cadastro?')) return;

  // Desabilita os botões durante a requisição
  const botoes = botao.closest('.action-buttons').querySelectorAll('button');
  botoes.forEach(btn => btn.disabled = true);
  botao.innerHTML = '<i class="ri-loader-4-line"></i> Processando...';

  try {
    const resposta = await fetch(
      `/api/solicitacoes/${id}/recusar`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authData.token}` },
      }
    );

    const resultado = await resposta.json();
    
    if (resposta.ok) {
      showAlert(resultado.message || 'Solicitação recusada.', () => {
        const linha = botao.closest('tr');
        if (linha) {
          linha.style.opacity = '0';
          setTimeout(() => {
            linha.remove();
            atualizarEstadoTabela();
          }, 300);
        }
      });
    } else {
      throw new Error(resultado.message || 'Erro ao recusar solicitação');
    }
  } catch (error) {
    console.error('Erro ao recusar:', error);
    showAlert(error.message || 'Erro ao recusar solicitação.');
    
    // Reabilita os botões em caso de erro
    botoes.forEach(btn => btn.disabled = false);
    botao.innerHTML = '<i class="ri-close-line"></i> Recusar';
  }
}

function atualizarEstadoTabela() {
  const container = document.getElementById('tabela-container');
  const tabela = container.querySelector('table');
  
  if (!tabela) return;
  
  const linhasRestantes = tabela.querySelectorAll('tbody tr').length;
  
  if (linhasRestantes === 0) {
    document.getElementById('mensagem').textContent = 'Nenhuma solicitação pendente.';
    container.innerHTML = '<div class="no-requests">Nenhuma solicitação de cadastro pendente</div>';
  } else {
    document.getElementById('mensagem').textContent = 
      `${linhasRestantes} solicitação(ões) pendente(s)`;
  }
}

window.addEventListener('DOMContentLoaded', carregarSolicitacoes);

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
      onConfirm();
    }
  });
}

// Adiciona suporte para fechar o alerta clicando fora
document.getElementById('custom-alert').addEventListener('click', function(e) {
  if (e.target === this) {
    this.style.display = 'none';
  }
});