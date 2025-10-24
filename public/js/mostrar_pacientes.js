function toggleDropdown() {
  const dropdown = document.getElementById('dropdown-content');
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  }
}

function toggleMenu() {
  const nav = document.getElementById('nav-buttons');
  nav.classList.toggle('show');
}

// Fecha dropdown ao clicar fora
window.onclick = function (event) {
  if (!event.target.matches('nav button')) {
    const dropdown = document.getElementById('dropdown-content');
    if (dropdown && dropdown.style.display === 'block') {
      dropdown.style.display = 'none';
    }
  }
};

const authData =
  JSON.parse(localStorage.getItem('auth')) ||
  JSON.parse(sessionStorage.getItem('auth'));

let gravidadesSelecionadas = ["todas"];
let pacientesGlobal = [];

// Inicializa filtro de gravidade
function inicializarFiltroGravidade() {
  const menu = document.getElementById("menu-gravidade");
  const abrirBtn = document.getElementById("abrir-filtro-gravidade");
  const botoes = menu.querySelectorAll(".gravidade-btn");

  abrirBtn.addEventListener("click", () => {
    menu.style.display = menu.style.display === "block" ? "none" : "block";
  });

  botoes.forEach(btn => {
    btn.addEventListener("click", () => {
      const valor = btn.getAttribute("data-valor");

      if (valor === "todas") {
        gravidadesSelecionadas = ["todas"];
        botoes.forEach(b => b.classList.remove("ativo"));
        btn.classList.add("ativo");
      } else {
        gravidadesSelecionadas = gravidadesSelecionadas.filter(v => v !== "todas");

        if (gravidadesSelecionadas.includes(valor)) {
          gravidadesSelecionadas = gravidadesSelecionadas.filter(v => v !== valor);
        } else {
          gravidadesSelecionadas.push(valor);
        }

        if (gravidadesSelecionadas.length === 0) {
          gravidadesSelecionadas = ["todas"];
        }

        botoes.forEach(b => {
          const val = b.getAttribute("data-valor");
          if (gravidadesSelecionadas.includes(val)) {
            b.classList.add("ativo");
          } else {
            b.classList.remove("ativo");
          }
        });
      }

      atualizarTabela();
    });
  });

  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !abrirBtn.contains(e.target)) {
      menu.style.display = "none";
    }
  });

  document.querySelector('.gravidade-btn[data-valor="todas"]').classList.add("ativo");
}

inicializarFiltroGravidade();

async function carregarPacientes() {
  try {
    let urlBase = '/api/pacientes/get';

    if (authData.tipo === 'hospital') {
      urlBase += `/${authData.dados.id}`;
    } else {
      urlBase += `/${authData.dados.hospitalId}`;
    }

    const resposta = await fetch(urlBase, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.token}`
      }
    });

    const pacientes = await resposta.json();
    pacientesGlobal = pacientes;

    const quartosUnicos = [...new Set(pacientes.map(p => p.quarto))].filter(q => q);
    const selectQuarto = document.getElementById('filtro-quarto');
    selectQuarto.innerHTML = '<option value="todos">Todos</option>';

    quartosUnicos.forEach(q => {
      const option = document.createElement('option');
      option.value = q;
      option.textContent = q;
      selectQuarto.appendChild(option);
    });

    // Adiciona os eventos para atualizar a tabela
    document.getElementById('search-input').addEventListener('input', atualizarTabela);
    document.getElementById('filtro-quarto').addEventListener('change', atualizarTabela);
    document.getElementById('filtro-sexo').addEventListener('change', atualizarTabela);
    document.getElementById('ordenar').addEventListener('change', atualizarTabela);

    // Mantém o filtro salvo (por 5 minutos)
    const filterData = localStorage.getItem('pacienteFilter');
    if (filterData) {
      const filter = JSON.parse(filterData);
      const now = new Date().getTime();
      const maxAge = 5 * 60 * 1000;

      if (now - filter.timestamp < maxAge) {
        const filtroQuartoSelect = document.getElementById('filtro-quarto');
        filtroQuartoSelect.value = filter.quarto;
      }

      localStorage.removeItem('pacienteFilter');
    }

    atualizarTabela();
  } catch (error) {
    console.error('Erro ao carregar pacientes:', error);
  }
}

function atualizarTabela() {
  const criterioOrdenacao = document.getElementById('ordenar').value;
  const filtroQuarto = document.getElementById('filtro-quarto').value;
  const filtroSexo = document.getElementById('filtro-sexo').value;
  const termoPesquisa = document.getElementById('search-input').value.toLowerCase();

  const gravidadeOrdem = { Azul: 0, Verde: 1, Amarelo: 2, Laranja: 3, Vermelho: 4 };
  let pacientesFiltrados = [...pacientesGlobal];

  if (termoPesquisa) {
    pacientesFiltrados = pacientesFiltrados.filter(p => p.nome.toLowerCase().includes(termoPesquisa));
  }

  if (!gravidadesSelecionadas.includes("todas")) {
    pacientesFiltrados = pacientesFiltrados.filter(p => gravidadesSelecionadas.includes(p.nivelalerta));
  }

  if (filtroQuarto !== 'todos') {
    pacientesFiltrados = pacientesFiltrados.filter(p => p.quarto == filtroQuarto);
  }

  if (filtroSexo !== 'todos') {
    pacientesFiltrados = pacientesFiltrados.filter(p => p.sexo == filtroSexo);
  }

  const pacientesOrdenados = pacientesFiltrados.sort((a, b) => {
    switch (criterioOrdenacao) {
      case 'nome-asc': return a.nome.localeCompare(b.nome);
      case 'nome-desc': return b.nome.localeCompare(a.nome);
      case 'idade-asc': return a.idade - b.idade;
      case 'idade-desc': return b.idade - a.idade;
      case 'estadia-asc': return a.estadia - b.estadia;
      case 'estadia-desc': return b.estadia - a.estadia;
      case 'nivelalerta-asc': return gravidadeOrdem[a.nivelalerta] - gravidadeOrdem[b.nivelalerta];
      case 'nivelalerta-desc': return gravidadeOrdem[b.nivelalerta] - gravidadeOrdem[a.nivelalerta];
      default: return 0;
    }
  });

  renderizarTabela(pacientesOrdenados);
}

function renderizarTabela(pacientes) {
  const container = document.getElementById('lista-pacientes');
  container.innerHTML = `
    <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Nível de Alerta</th>
          <th>Idade</th>
          <th>Sexo</th>
          <th>Relatório</th>
          <th>Prescrição</th>
          <th>Estadia (dias)</th>
          <th>Quarto</th>
        </tr>
      </thead>
      <tbody>
        ${pacientes.map(p => `
          <tr>
            <td><button onclick='verPaciente(${JSON.stringify(p)})' class="link-button">${p.nome}</button></td>
            <td><i class="ri-alert-fill alert-icon ${p.nivelalerta}"></i> ${p.nivelalerta}</td>
            <td>${p.idade}</td>
            <td>${p.sexo || ''}</td>
            <td>${p.relatorio}</td>
            <td>${p.prescricao}</td>
            <td>${p.estadia}</td>
            <td>${p.quarto}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function verPaciente(paciente) {
  localStorage.setItem('pacienteSelecionado', JSON.stringify(paciente));
  window.location.href = 'paciente.html';
}

window.addEventListener('DOMContentLoaded', carregarPacientes);

// Tela de loading
window.addEventListener('load', function () {
  setTimeout(() => {
    const loading = document.getElementById('loading-screen');
    if (loading) {
      loading.style.opacity = '0';
      setTimeout(() => (loading.style.display = 'none'), 500);
    }
  }, 1000);
});
