function toggleDropdown() {
  const dropdown = document.getElementById('dropdown-content');
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function toggleMenu() {
  const nav = document.getElementById('nav-buttons');
  nav.classList.toggle('show');
}

// Fechar dropdown ao clicar fora dele
window.onclick = function (event) {
  if (!event.target.matches('nav button')) {
    const dropdown = document.getElementById('dropdown-content');
    if (dropdown && dropdown.style.display === 'block') {
      dropdown.style.display = 'none';
    }
  }
};

// Ocultar loading inicial após carregamento
window.addEventListener('load', function () {
  const loading = document.getElementById('loading-screen');
  if (loading) {
    setTimeout(() => {
      loading.style.opacity = '0';
      setTimeout(() => (loading.style.display = 'none'), 500);
    }, 1000);
  }
});

const authData =
  JSON.parse(localStorage.getItem('auth')) ||
  JSON.parse(sessionStorage.getItem('auth'));

if (!authData) {
  window.location.href = 'login.html';
}

let funcionariosGlobal = [];
let funcoesSelecionadas = ['todas'];

async function carregarFuncionarios() {
  try {
    let urlBase = '/api/usuarios/funcionarios';

    if (authData.tipo === 'hospital') {
      urlBase += `/${authData.dados.id}`;
    } else {
      urlBase += `/${authData.dados.hospitalId}`;
    }

    const resposta = await fetch(urlBase, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authData.token}`,
      },
    });

    const funcionarios = await resposta.json();
    funcionariosGlobal = funcionarios;
    atualizarTabela();
  } catch (error) {
    console.error('Erro ao carregar funcionários:', error);
  }
}

function inicializarFiltroFuncao() {
  const menu = document.getElementById('menu-funcao');
  const abrirBtn = document.getElementById('abrir-filtro-funcao');
  const botoes = menu.querySelectorAll('.funcao-btn');

  abrirBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  });

  botoes.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const valor = btn.getAttribute('data-valor');

      if (valor === 'todas') {
        funcoesSelecionadas = ['todas'];
        botoes.forEach((b) => b.classList.remove('ativo'));
        btn.classList.add('ativo');
      } else {
        funcoesSelecionadas = funcoesSelecionadas.filter((v) => v !== 'todas');

        if (funcoesSelecionadas.includes(valor)) {
          funcoesSelecionadas = funcoesSelecionadas.filter((v) => v !== valor);
        } else {
          funcoesSelecionadas.push(valor);
        }

        if (funcoesSelecionadas.length === 0) {
          funcoesSelecionadas = ['todas'];
        }

        botoes.forEach((b) => {
          const val = b.getAttribute('data-valor');
          if (
            funcoesSelecionadas.includes(val) ||
            (val === 'todas' && funcoesSelecionadas.includes('todas'))
          ) {
            b.classList.add('ativo');
          } else {
            b.classList.remove('ativo');
          }
        });
      }

      atualizarTabela();
    });
  });

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !abrirBtn.contains(e.target)) {
      menu.style.display = 'none';
    }
  });

  document
    .querySelector('.funcao-btn[data-valor="todas"]')
    .classList.add('ativo');
}

function atualizarTabela() {
  const criterioOrdenacao = document.getElementById('ordenar').value;
  const termoPesquisa = document
    .getElementById('search-input')
    .value.toLowerCase();

  let funcionariosFiltrados = [...funcionariosGlobal];

  if (termoPesquisa) {
    funcionariosFiltrados = funcionariosFiltrados.filter(
      (f) =>
        f.nome.toLowerCase().includes(termoPesquisa) ||
        (f.email && f.email.toLowerCase().includes(termoPesquisa)) ||
        (f.cpf && f.cpf.toString().includes(termoPesquisa)) ||
        (f.crm && f.crm.toString().toLowerCase().includes(termoPesquisa))
    );
  }

  if (!funcoesSelecionadas.includes('todas')) {
    funcionariosFiltrados = funcionariosFiltrados.filter((f) =>
      funcoesSelecionadas.includes(f.tipo_user.toString())
    );
  }

  funcionariosFiltrados.sort((a, b) => {
    switch (criterioOrdenacao) {
      case 'nome-asc':
        return a.nome.localeCompare(b.nome);
      case 'nome-desc':
        return b.nome.localeCompare(a.nome);
      default:
        return 0;
    }
  });

  renderizarTabela(funcionariosFiltrados);
}

function focusSearch() {
  document.getElementById('search-input').focus();
}

function renderizarTabela(funcionarios) {
  const container = document.getElementById('lista-funcionarios');
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Email</th>
          <th>CPF</th>
          <th>CRM</th>
          <th>Função</th>
        </tr>
      </thead>
      <tbody>
        ${funcionarios
          .map(
            (f) => `
          <tr>
            <td data-label="Nome">${f.nome}</td>
            <td data-label="Email">${f.email}</td>
            <td data-label="CPF">${f.cpf}</td>
            <td data-label="CRM">${f.crm || ''}</td>
            <td data-label="Função">
              ${
                f.tipo_user === 1
                  ? 'Técnico'
                  : f.tipo_user === 2
                  ? 'Enfermeiro'
                  : f.tipo_user === 3
                  ? 'Médico'
                  : ''
              }
            </td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>
  `;
}

window.addEventListener('DOMContentLoaded', () => {
  carregarFuncionarios();
  inicializarFiltroFuncao();
  document
    .getElementById('search-input')
    .addEventListener('input', atualizarTabela);
});
