// Variável global para armazenar os pacientes
let pacientes = [];

// Função para salvar dados do paciente no localStorage
function salvarPacienteLocalStorage(pacienteData) {
  if (pacienteData && pacienteData.id) {
    localStorage.setItem('pacienteSelecionado', JSON.stringify(pacienteData));
    console.log('Paciente salvo no localStorage:', pacienteData.nome);
    return true;
  }
  console.error('Dados do paciente inválidos para salvar no localStorage');
  return false;
}

// Função para preparar e gerar PDF
function prepararEGerarPDF(pacienteData) {
  if (salvarPacienteLocalStorage(pacienteData)) {
    if (typeof gerarPDFComFallback !== 'undefined') {
      gerarPDFComFallback();
    } else if (typeof gerarPDF !== 'undefined') {
      gerarPDF();
    } else {
      alert('Função de geração de PDF não encontrada.');
    }
  } else {
    alert('Erro ao salvar dados do paciente. Não foi possível gerar o PDF.');
  }
}

// Buscar pacientes críticos do servidor
async function carregarPacientesCriticos() {
  try {
    document.getElementById('error-message').style.display = 'none';
    document.getElementById('loading-screen').style.display = 'flex';
    document.getElementById('loading-screen').style.opacity = '1';

    const authData =
      JSON.parse(localStorage.getItem('auth')) ||
      JSON.parse(sessionStorage.getItem('auth'));

    let urlBase = 'http://localhost:3000/api/pacientes/get';

    if (authData.tipo === 'hospital') {
      urlBase += `/${authData.dados.id}/critico`;
    } else {
      urlBase += `/${authData.dados.hospitalId}/critico`;
    }

    const response = await fetch(urlBase, {
      headers: {
        'Authorization': `Bearer ${authData.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

    const data = await response.json();
    pacientes = data;

    renderizarPacientes();
    configurarCarrossel();
    configurarFiltros();

    document.getElementById('loading-screen').style.opacity = '0';
    setTimeout(() => {
      document.getElementById('loading-screen').style.display = 'none';
    }, 500);
  } catch (error) {
    console.error('Erro ao carregar pacientes:', error);

    document.getElementById('loading-screen').style.opacity = '0';
    setTimeout(() => {
      document.getElementById('loading-screen').style.display = 'none';
    }, 500);

    document.getElementById('error-message').style.display = 'block';

    const carrossel = document.getElementById('pacientes-carrossel');
    carrossel.innerHTML = `
      <div class="empty-state">
        <i class="ri-error-warning-line"></i>
        <h3>Erro ao carregar dados</h3>
        <p>${error.message || 'Não foi possível carregar os pacientes. Tente novamente.'}</p>
      </div>
    `;
  }
}

// Renderizar pacientes
function renderizarPacientes(filtro = 'todos') {
  const carrossel = document.getElementById('pacientes-carrossel');
  carrossel.innerHTML = '';

  const pacientesFiltrados =
    filtro === 'todos'
      ? pacientes
      : pacientes.filter(p => p.nivelalerta.toLowerCase() === filtro);

  if (pacientesFiltrados.length === 0) {
    carrossel.innerHTML = `
      <div class="empty-state">
        <i class="ri-user-search-line"></i>
        <h3>Nenhum paciente encontrado</h3>
        <p>Não há pacientes com o nível de alerta selecionado.</p>
      </div>
    `;
    return;
  }

  pacientesFiltrados.forEach(paciente => {
    const card = document.createElement('div');
    card.className = `paciente-card ${paciente.nivelalerta.toLowerCase()}`;

    const nivelClass =
      paciente.nivelalerta.toLowerCase() === 'vermelho'
        ? 'nivel-vermelho'
        : 'nivel-laranja';
    const dotClass =
      paciente.nivelalerta.toLowerCase() === 'vermelho'
        ? 'dot-vermelho'
        : 'dot-laranja';

    card.innerHTML = `
      <h2>${paciente.nome}</h2>
      <p><strong>Idade:</strong> ${paciente.idade} anos</p>
      <p><strong>Sexo:</strong> ${paciente.sexo}</p>
      <p><strong>Nível de Alerta:</strong> <span class="nivel-alerta ${nivelClass}">${paciente.nivelalerta}</span></p>
      <div class="status-indicator">
        <span class="status-dot ${dotClass}"></span>
        <span> ${paciente.nivelalerta === 'Vermelho' ? 'Emergência' : 'Prioridade'}</span>
      </div>
      <p><strong>Relatório:</strong> ${paciente.relatorio || 'Nenhum relatório disponível'}</p>
      <p><strong>Prescrição:</strong> ${paciente.prescricao || 'Nenhuma prescrição disponível'}</p>
      <p><strong>Estadia:</strong> ${paciente.estadia} dias</p>
      <p><strong>Quarto:</strong> ${paciente.quarto || 'Não atribuído'}</p>
      <div class="card-actions">
        <a href="paciente.html" onclick='salvarPacienteLocalStorage(${JSON.stringify(paciente).replace(/"/g, "&quot;")})'>
          <i class="ri-user-line"></i> Ver detalhes
        </a>
        <button class="gerar-pdf-btn" onclick='prepararEGerarPDF(${JSON.stringify(paciente).replace(/"/g, "&quot;")})'>
          <i class="ri-file-pdf-line"></i> Gerar PDF
        </button>
      </div>
    `;

    carrossel.appendChild(card);
  });

  if (window.innerWidth <= 768) {
    setTimeout(() => {
      carrossel.scrollLeft = 0;
    }, 100);
  }
}

// Controlar carrossel
function configurarCarrossel() {
  const carrossel = document.getElementById('pacientes-carrossel');
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');
  const cardWidth = 320;

  prevBtn.addEventListener('click', () => {
    carrossel.scrollBy({ left: -cardWidth, behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', () => {
    carrossel.scrollBy({ left: cardWidth, behavior: 'smooth' });
  });
}

// Filtros
function configurarFiltros() {
  const filtroBtns = document.querySelectorAll('.filtro-btn');
  filtroBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filtroBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filtro = btn.getAttribute('data-filtro');
      renderizarPacientes(filtro);
    });
  });
}

// Fechar dropdown e menu ao clicar fora
window.onclick = function (event) {
  if (!event.target.matches('nav button')) {
    const dropdown = document.getElementById('dropdown-content');
    if (dropdown && dropdown.style.display === 'block') {
      dropdown.style.display = 'none';
    }
    const nav = document.getElementById('nav-buttons');
    if (nav.classList.contains('show') && !event.target.matches('.hamburger')) {
      nav.classList.remove('show');
    }
  }
};

// Reajustar o carrossel ao redimensionar a janela
window.addEventListener('resize', function () {
  const activeFilter = document.querySelector('.filtro-btn.active').getAttribute('data-filtro');
  renderizarPacientes(activeFilter);
});

// Carregar pacientes ao iniciar
window.addEventListener('load', function () {
  carregarPacientesCriticos();
});
