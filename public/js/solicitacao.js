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
      return;
    }

    document.getElementById('mensagem').textContent = '';
    renderizarTabela(solicitacoes);
  } catch (error) {
    console.error('Erro ao carregar solicitações:', error);
    document.getElementById('mensagem').textContent =
      'Erro ao carregar solicitações.';
  }
}

function renderizarTabela(solicitacoes) {
  const container = document.getElementById('tabela-container');

  container.innerHTML = `
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
            <td>${s.user.nome}</td>
            <td>${s.user.email}</td>
            <td>${
              s.user.tipo_user === 1
                ? 'Técnico'
                : s.user.tipo_user === 2
                ? 'Enfermeiro'
                : s.user.tipo_user === 3
                ? 'Médico'
                : ''
            }</td>
            <td>
              <button class="btn btn-aceitar" onclick="aprovarSolicitacao(${s.id}, this)">
                <i class="ri-check-line"></i> Aprovar
              </button>
              <button class="btn btn-recusar" onclick="recusarSolicitacao(${s.id}, this)">
                <i class="ri-close-line"></i> Recusar
              </button>
            </td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;
}

async function aprovarSolicitacao(id, botao) {
  if (!confirm('Aprovar esta solicitação?')) return;

  try {
    const resposta = await fetch(
      `/api/solicitacoes/${id}/aprovar`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${authData.token}` },
      }
    );

    const resultado = await resposta.json();
    alert(resultado.message || 'Solicitação aprovada!');

    const linha = botao.closest('tr');
    if (linha) linha.remove();
  } catch (error) {
    console.error('Erro ao aprovar:', error);
    alert('Erro ao aprovar solicitação.');
  }
}

async function recusarSolicitacao(id, botao) {
  if (!confirm('Tem certeza que deseja recusar e excluir o usuário?')) return;

  try {
    const resposta = await fetch(
      `/api/solicitacoes/${id}/recusar`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authData.token}` },
      }
    );

    const resultado = await resposta.json();
    alert(resultado.message || 'Solicitação recusada.');

    const linha = botao.closest('tr');
    if (linha) linha.remove();
  } catch (error) {
    console.error('Erro ao recusar:', error);
    alert('Erro ao recusar solicitação.');
  }
}

window.addEventListener('DOMContentLoaded', carregarSolicitacoes);
