function toggleDropdown() {
    const dropdown = document.getElementById('dropdown-content');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

function toggleMenu() {
    const nav = document.getElementById('nav-buttons');
    if (nav) nav.classList.toggle('show');
}

window.onclick = function (event) {
    if (!event.target.matches('nav button')) {
        const dropdown = document.getElementById('dropdown-content');
        if (dropdown && dropdown.style.display === 'block') {
            dropdown.style.display = 'none';
        }
    }
};

window.addEventListener("pageshow", function (event) {
    if (event.persisted) window.location.reload();
});

// Variáveis globais
window.pacienteData = null;
let patientId = null;
let hospitalId = null;

function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');

    if (sessionId) {
        const sessionData = sessionStorage.getItem(sessionId);
        if (sessionData) {
            try {
                const data = JSON.parse(sessionData);
                sessionStorage.removeItem(sessionId);
                return data;
            } catch (e) {
                console.error('Erro ao analisar dados da sessão:', e);
            }
        }
    }

    return {
        patientId: urlParams.get('patientId'),
        hospitalId: urlParams.get('hospitalId')
    };
}

async function carregarDadosPaciente() {
    const params = getUrlParams();
    patientId = params.patientId;
    hospitalId = params.hospitalId;

    if (patientId && hospitalId) {
        try {
            const response = await fetch(`/api/pacientes/${patientId}?hospitalId=${hospitalId}`);
            window.pacienteData = await response.json();
            preencherCampos(window.pacienteData);
        } catch (error) {
            console.error('Erro ao buscar paciente:', error);
            carregarDoLocalStorage();
        }
    } else {
        carregarDoLocalStorage();
    }
}

function carregarDoLocalStorage() {
    window.pacienteData = JSON.parse(localStorage.getItem('pacienteSelecionado'));
    if (window.pacienteData) {
        preencherCampos(window.pacienteData);
    } else {
        console.error('Nenhum paciente encontrado no LocalStorage');
    }
}

function preencherCampos(paciente) {
    if (!paciente) {
        console.error('Dados do paciente não disponíveis');
        return;
    }

    document.getElementById('nome').textContent = paciente.nome || 'Nome não informado';
    document.getElementById('idade').textContent = paciente.idade || '--';
    document.getElementById('sexo').textContent = paciente.sexo || '--';
    document.getElementById('nivelalerta').textContent = paciente.nivelalerta || '--';
    document.getElementById('relatorio').textContent = paciente.relatorio || '--';
    document.getElementById('prescricao').textContent = paciente.prescricao || '--';
    document.getElementById('estadia').textContent = paciente.estadia || '--';
    document.getElementById('quarto').textContent = paciente.quarto || '--';
}

// Controle de acesso: botão "Dar Alta"
const authData = JSON.parse(localStorage.getItem('auth')) || JSON.parse(sessionStorage.getItem('auth'));
const tipoUsuario = authData?.dados?.tipo_user || 0;
const altaContainer = document.getElementById('alta-container');

if (tipoUsuario === 2 || tipoUsuario === 3) {
    altaContainer.style.display = 'block';

    document.getElementById('btnAlta').addEventListener('click', async () => {
        if (!window.pacienteData) return;

        const confirmAlta = confirm(`Deseja realmente dar alta ao paciente ${window.pacienteData.nome}?`);
        if (!confirmAlta) return;

        try {
            const response = await fetch(`/api/pacientes/${window.pacienteData.id}/alta`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                alert('Paciente recebeu alta com sucesso!');
                window.location.href = 'mostrar_pacientes.html';
            } else {
                const error = await response.json();
                alert('Erro ao dar alta: ' + (error.message || 'Tente novamente.'));
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao conectar com o servidor.');
        }
    });
}

// Tela de carregamento
window.addEventListener('load', function () {
    carregarDadosPaciente();

    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        const randomDelay = Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => (loadingScreen.style.display = 'none'), 500);
        }, randomDelay);
    }
});
