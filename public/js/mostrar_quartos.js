// Função para obter informações do usuário autenticado
function getAuthInfo() {
  try {
    const authData = JSON.parse(localStorage.getItem('auth')) || JSON.parse(sessionStorage.getItem('auth'));;
    if (authData) {

      return JSON.parse(authData);
    }
  } catch (error) {
    console.error('Erro ao obter dados de autenticação:', error);
  }
  return null;
}


function getHospitalId(auth) {
  if (!auth) return null;
  return auth.tipo === "hospital" ? auth.dados.id : auth.dados.hospitalId;
}

async function getHospitalName(auth) {
  if (!auth) return "Hospital";


  if (auth.tipo === "hospital") {
    return auth.dados?.nome || "Hospital";
  }


  if (auth.tipo === "usuario") {
    const hospitalId = auth.dados?.hospitalId;
    if (!hospitalId) return "Hospital";

    try {
      const response = await fetch(`/api/hospital/${hospitalId}`);
      if (!response.ok) return "Hospital";

      const hospital = await response.json();
      return hospital.nome || "Hospital";

    } catch (err) {
      console.error("Erro ao buscar nome do hospital:", err);
      return "Hospital";
    }
  }

  return "Hospital";
}


async function loadRooms(hospitalId, hospitalName) {
  const roomsContainer = document.getElementById('rooms-container');
  const hospitalInfo = document.getElementById('hospital-info');

  // Atualiza informações do hospital
  hospitalInfo.innerHTML = `
    <h2>${hospitalName}</h2>
    <p>Lista de quartos com pacientes cadastrados</p>
  `;

  roomsContainer.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Carregando quartos...</p>
    </div>
  `;

  try {
    const response = await fetch(`/api/pacientes/get/${hospitalId}/quartos`);
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

    const rooms = await response.json();

    if (rooms.length === 0) {
      roomsContainer.innerHTML = `
        <div class="no-rooms">
          <h3>Nenhum quarto cadastrado para este hospital</h3>
          <p>Não há pacientes com quartos atribuídos neste hospital.</p>
        </div>
      `;
      return;
    }

    roomsContainer.innerHTML = `
      <h2 style="text-align: center; margin-bottom: 20px;">Quartos disponíveis</h2>
      <div class="rooms-grid"></div>
    `;

    const roomsGrid = document.querySelector('.rooms-grid');

    const sortedRooms = rooms.sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });

    sortedRooms.forEach(room => {
      const button = document.createElement('button');
      button.className = 'room-button';
      button.textContent = room;
      button.onclick = () => {
        const filterData = {
          hospitalId: hospitalId,
          quarto: room,
          timestamp: new Date().getTime()
        };

        localStorage.setItem('pacienteFilter', JSON.stringify(filterData));
        window.location.href = 'mostrar_pacientes.html';
      };
      roomsGrid.appendChild(button);
    });
  } catch (error) {
    console.error('Erro ao carregar quartos:', error);
    roomsContainer.innerHTML = `
      <div class="no-rooms">
        <h3>Erro ao carregar quartos</h3>
        <p>Ocorreu um erro ao tentar carregar a lista de quartos: ${error.message}</p>
        <button onclick="location.reload()" style="margin-top: 15px; padding: 10px 20px; background: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer;">
          Tentar novamente
        </button>
      </div>
    `;
  }
}

// Inicialização quando a página carrega
document.addEventListener('DOMContentLoaded', function () {

  if (!authData) {
    window.location.href = 'login.html';
    return;
  }

  const hospitalId = getHospitalId(authData);
  (async () => {
    const hospitalName = await getHospitalName(authData);
    loadRooms(hospitalId, hospitalName);
  })();


  if (!hospitalId) {
    document.getElementById('rooms-container').innerHTML = `
      <div class="no-rooms">
        <h3>Erro de configuração</h3>
        <p>Não foi possível identificar o hospital associado a este usuário.</p>
      </div>
    `;
    return;
  }

  loadRooms(hospitalId, hospitalName);
});

// Funções do menu
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
