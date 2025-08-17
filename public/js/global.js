const TIPOS_USUARIO = {
    USUARIO: 1,
    ENFERMEIRO: 2,
    MEDICO: 3,
    HOSPITAL: 4
};

const botoesPorTipo = {
    [TIPOS_USUARIO.USUARIO]: [
        { nome: 'Avaliar', icone: 'ri-stethoscope-line' },
        { nome: 'Pacientes', icone: 'ri-user-heart-line' },
        { nome: 'Quartos', icone: 'ri-hotel-bed-line' },
        { nome: 'Sair', icone: 'ri-logout-box-line', funcao: sair }
    ],
    [TIPOS_USUARIO.ENFERMEIRO]: [
        { nome: 'Avaliar', icone: 'ri-stethoscope-line' },
        { nome: 'Pacientes', icone: 'ri-user-heart-line' },
        { nome: 'Quartos', icone: 'ri-hotel-bed-line' },
        { nome: 'Remédios', icone: 'ri-capsule-line' },
        { nome: 'Sair', icone: 'ri-logout-box-line', funcao: sair }
    ],
    [TIPOS_USUARIO.MEDICO]: [
        { nome: 'Avaliar', icone: 'ri-stethoscope-line' },
        { nome: 'Pacientes', icone: 'ri-user-heart-line' },
        { nome: 'Quartos', icone: 'ri-hotel-bed-line' },
        { nome: 'Remédios', icone: 'ri-capsule-line' },
        { nome: 'Sair', icone: 'ri-logout-box-line', funcao: sair }
    ],
    [TIPOS_USUARIO.HOSPITAL]: [
        { nome: 'Pacientes', icone: 'ri-user-heart-line' },
        { nome: 'Quartos', icone: 'ri-hotel-bed-line' },
        { nome: 'Funcionários', icone: 'ri-team-line' },
        { nome: 'Relatórios', icone: 'ri-file-chart-line' },
        { nome: 'Sair', icone: 'ri-logout-box-line', funcao: sair }
    ]
};

function verificarAutenticacao() {
    const authData = JSON.parse(localStorage.getItem('auth')) || 
                   JSON.parse(sessionStorage.getItem('auth'));


    
    if (!authData) {
        console.log(authData);
        window.location.href = 'login.html';
        return null;
    } else if (authData.dados.status_senha === 1) {
        window.location.href = 'trocar_senha.html';
    return null;
    }
    window.authData = authData; // Atribui ao escopo global
    return authData;
}

function configurarNavegacao() {
    const authData = verificarAutenticacao();
    const nav = document.getElementById('nav-buttons');
    const tipoUsuario = authData.dados.tipo_user;

    if (tipoUsuario && nav) {
        let sairBotao = null;

        botoesPorTipo[tipoUsuario].forEach(item => {
            if (item.nome === 'Pacientes') {
                configurarDropdownPacientes(nav, item, tipoUsuario);
            } else if (item.nome === 'Quartos') {
                configurarDropdownQuartos(nav, item, tipoUsuario);
            } else if (item.nome === 'Sair') {
                sairBotao = criarBotao(item);
            } else if (item.nome === 'Funcionários' && tipoUsuario >= 3) {
                const botaoFuncionarios = document.createElement('button');
                botaoFuncionarios.innerHTML = `<i class="${item.icone}"></i> ${item.nome}`;
                botaoFuncionarios.onclick = () => window.location.href = 'funcionarios.html';
                nav.insertBefore(botaoFuncionarios, nav.querySelector('.dropdown'));
            } else {
                const botao = criarBotao(item);
                nav.insertBefore(botao, nav.querySelector('.dropdown'));
            }
        });

        if (sairBotao) {
            nav.appendChild(sairBotao);
        }
    }
}

function criarBotao(item) {
    const botao = document.createElement('button');
    botao.innerHTML = `<i class="${item.icone}"></i> ${item.nome}`;
    if (item.funcao) {
        botao.addEventListener('click', item.funcao);
    }
    return botao;
}

function configurarDropdownPacientes(nav, item, tipoUsuario) {
    const dropdownPacientes = document.createElement('div');
    dropdownPacientes.classList.add('dropdown');

    const botaoPacientes = document.createElement('button');
    botaoPacientes.innerHTML = `<i class="${item.icone}"></i> ${item.nome}`;
    botaoPacientes.onclick = () => toggleDropdownPacientes();
    dropdownPacientes.appendChild(botaoPacientes);

    const dropdownContentPacientes = document.createElement('div');
    dropdownContentPacientes.classList.add('dropdown-content');
    dropdownContentPacientes.id = 'dropdown-pacientes-content';

    const visualizar = document.createElement('button');
    visualizar.innerHTML = `<i class="ri-eye-line"></i> Visualizar Pacientes`;
    visualizar.onclick = visualizar_pacientes;
    dropdownContentPacientes.appendChild(visualizar);

    if (tipoUsuario >= 2) {
        const gerenciar = document.createElement('button');
        gerenciar.innerHTML = `<i class="ri-settings-3-line"></i> Gerenciar Pacientes`;
        gerenciar.onclick = gerenciar_paciente;
        dropdownContentPacientes.appendChild(gerenciar);
    }

    if (tipoUsuario === 3) {
        const adicionar = document.createElement('button');
        adicionar.innerHTML = `<i class="ri-user-add-line"></i> Adicionar Paciente`;
        adicionar.onclick = cadastro_paciente;
        dropdownContentPacientes.appendChild(adicionar);
    }

    dropdownPacientes.appendChild(dropdownContentPacientes);
    nav.insertBefore(dropdownPacientes, nav.querySelector('.dropdown'));
}


function configurarDropdownQuartos(nav, item, tipoUsuario) {
    const dropdownQuartos = document.createElement('div');
    dropdownQuartos.classList.add('dropdown');

    const botaoQuartos = document.createElement('button');
    botaoQuartos.innerHTML = `<i class="${item.icone}"></i> ${item.nome}`;
    botaoQuartos.onclick = () => toggleDropdownQuartos();
    dropdownQuartos.appendChild(botaoQuartos);

    const dropdownContentQuartos = document.createElement('div');
    dropdownContentQuartos.classList.add('dropdown-content');
    dropdownContentQuartos.id = 'dropdown-quartos-content';

    const visualizar = document.createElement('button');
    visualizar.innerHTML = `<i class="ri-eye-line"></i> Visualizar Quartos`;
    visualizar.onclick = visualizar_quartos;
    dropdownContentQuartos.appendChild(visualizar);

    if (tipoUsuario >= 2) {
        const gerenciar = document.createElement('button');
        gerenciar.innerHTML = `<i class="ri-settings-3-line"></i> Gerenciar Quartos`;
        dropdownContentQuartos.appendChild(gerenciar);
    }

    dropdownQuartos.appendChild(dropdownContentQuartos);
    nav.insertBefore(dropdownQuartos, nav.querySelector('.dropdown'));
}


function sair() {
    localStorage.removeItem('auth');
    localStorage.removeItem('theme');
    sessionStorage.removeItem('auth');
    sessionStorage.removeItem('theme');
    window.location.href = 'login.html';
}

function cadastro_paciente() {
    window.location.href = 'cadastro_paciente.html';
}

function gerenciar_paciente() {
    window.location.href = 'paciente.html';
}

function visualizar_pacientes() {
    window.location.href = 'mostrar_pacientes.html';
}

function visualizar_quartos() {
    window.location.href = 'mostrar_quartos.html';
}


function toggleDropdown() {
    closeDropdown();
    document.getElementById('dropdown-content').classList.toggle('show');
}

function toggleDropdownPacientes() {
    closeDropdown();
    const dropdown = document.getElementById('dropdown-pacientes-content');
    if (dropdown) dropdown.classList.toggle('show');
}

function toggleDropdownQuartos() {
    closeDropdown();
    const dropdown = document.getElementById('dropdown-quartos-content');
    if (dropdown) dropdown.classList.toggle('show');
}

function setDarkMode() {
    document.body.classList.add('dark-mode');
    localStorage.setItem('theme', 'dark');
    sessionStorage.setItem('theme', 'dark');
    closeDropdown();
}

function setLightMode() {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light');
    sessionStorage.setItem('theme', 'light');
    closeDropdown();
}

function aplicarTemaSalvo() {
    const savedThemeSession = sessionStorage.getItem('theme');
    if (savedThemeSession) {
        if (savedThemeSession === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    } else {
        const savedThemeLocal = localStorage.getItem('theme');
        if (savedThemeLocal) {
            if (savedThemeLocal === 'dark') {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        }
    }
}

function closeDropdown() {
    const tema = document.getElementById('dropdown-content');
    const pacientes = document.getElementById('dropdown-pacientes-content');
    const quartos = document.getElementById('dropdown-quartos-content');

    if (tema) tema.classList.remove('show');
    if (pacientes) pacientes.classList.remove('show');
    if (quartos) quartos.classList.remove('show');
}

function toggleMenu() {
    const nav = document.getElementById('nav-buttons');
    if (nav) nav.classList.toggle('show');
}

function configurarEventosClique() {
    window.onclick = function(event) {
        if (!event.target.closest('.dropdown') && !event.target.closest('.hamburger')) {
            closeDropdown();
            if (window.innerWidth <= 768) {
                const nav = document.getElementById('nav-buttons');
                if (nav) nav.classList.remove('show');
            }
        }
    };
}

function configurarLoadingScreen() {
    window.addEventListener('load', function() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            const randomDelay = Math.floor(Math.random() * (2500 - 1000 + 1)) + 1000;
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => loadingScreen.style.display = 'none', 500);
            }, randomDelay);
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    verificarAutenticacao();
    configurarNavegacao();
    aplicarTemaSalvo();
    configurarEventosClique();
    configurarLoadingScreen();
    
    const dropdownTema = document.getElementById('dropdown-content');
    if (dropdownTema) {
        const btnLight = dropdownTema.querySelector('button[onclick="setLightMode()"]');
        const btnDark = dropdownTema.querySelector('button[onclick="setDarkMode()"]');
        
        if (btnLight) btnLight.onclick = setLightMode;
        if (btnDark) btnDark.onclick = setDarkMode;
    }
});