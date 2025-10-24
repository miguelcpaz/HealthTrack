const TIPOS_USUARIO = {
    USUARIO: 1,
    ENFERMEIRO: 2,
    MEDICO: 3,
    HOSPITAL: 4
};

const botoesPorTipo = {
    [TIPOS_USUARIO.USUARIO]: [
        { nome: 'Pacientes', icone: 'ri-user-heart-line' },
        { nome: 'Quartos', icone: 'ri-hotel-bed-line' },
        { nome: 'Sair', icone: 'ri-logout-box-line', funcao: sair }
    ],
    [TIPOS_USUARIO.ENFERMEIRO]: [
        { nome: 'Pacientes', icone: 'ri-user-heart-line' },
        { nome: 'Quartos', icone: 'ri-hotel-bed-line' },
        { nome: 'Remédios', icone: 'ri-capsule-line' },
        { nome: 'Sair', icone: 'ri-logout-box-line', funcao: sair }
    ],
    [TIPOS_USUARIO.MEDICO]: [
        { nome: 'Pacientes', icone: 'ri-user-heart-line' },
        { nome: 'Quartos', icone: 'ri-hotel-bed-line' },
        { nome: 'Remédios', icone: 'ri-capsule-line' },
        { nome: 'Sair', icone: 'ri-logout-box-line', funcao: sair }
    ],
    [TIPOS_USUARIO.HOSPITAL]: [
        { nome: 'Pacientes', icone: 'ri-user-heart-line' },
        { nome: 'Quartos', icone: 'ri-hotel-bed-line' },
        { nome: 'Funcionários', icone: 'ri-team-line' },
        { nome: 'Solicitações', icone: 'ri-file-chart-line', funcao: solicitacoes },
        { nome: 'Sair', icone: 'ri-logout-box-line', funcao: sair }
    ]
};

function verificarAutenticacao() {
    const authData = JSON.parse(localStorage.getItem('auth')) ||
                     JSON.parse(sessionStorage.getItem('auth'));
    if (!authData) {
        window.location.href = 'login.html';
        return null;
    } else if (authData.dados.status_senha === 1) {
        window.location.href = 'trocar_senha.html';
        return null;
    }
    window.authData = authData;
    return authData;
}

function configurarNavegacao() {
    const authData = verificarAutenticacao();
    if (!authData) return;

    const nav = document.getElementById('nav-buttons');
    if (!nav) return;

    // Dropdown de Tema
    const dropdownTema = document.createElement('div');
    dropdownTema.classList.add('dropdown');

    const botaoTema = document.createElement('button');
    botaoTema.innerHTML = `<i class="ri-moon-clear-line"></i> Tema`;
    botaoTema.onclick = () => toggleDropdownTema();
    dropdownTema.appendChild(botaoTema);

    const dropdownContentTema = document.createElement('div');
    dropdownContentTema.classList.add('dropdown-content');
    dropdownContentTema.id = 'dropdown-tema-content';

    const btnClaro = document.createElement('button');
    btnClaro.innerHTML = `<i class="ri-sun-line"></i> Claro`;
    btnClaro.onclick = setLightMode;
    dropdownContentTema.appendChild(btnClaro);

    const btnEscuro = document.createElement('button');
    btnEscuro.innerHTML = `<i class="ri-moon-line"></i> Escuro`;
    btnEscuro.onclick = setDarkMode;
    dropdownContentTema.appendChild(btnEscuro);

    dropdownTema.appendChild(dropdownContentTema);

    function toggleDropdownTema() {
        const dropdown = document.getElementById('dropdown-tema-content');
        if (dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        } else {
            closeDropdown();
            dropdown.classList.add('show');
        }
    }

    const tipoUsuario = authData.dados.tipo_user || TIPOS_USUARIO.HOSPITAL;
    let sairBotao = null;

    let botoesParaCriar = botoesPorTipo[tipoUsuario];

    // Ordem personalizada apenas para Hospital
    if (tipoUsuario === TIPOS_USUARIO.HOSPITAL) {
        const ordemDesejada = ['Solicitações', 'Funcionários', 'Quartos', 'Pacientes'];
        botoesParaCriar = ordemDesejada
            .map(nome => botoesPorTipo[tipoUsuario].find(b => b.nome === nome))
            .filter(Boolean);
    }

    botoesParaCriar.forEach(item => {
        let botao;

        if (item.nome === 'Pacientes') {
            botao = criarDropdown(nav, item, tipoUsuario, 'pacientes');
        } else if (item.nome === 'Quartos') {
            botao = criarBotao({ ...item, funcao: visualizar_quartos });
        } else if (item.nome === 'Funcionários') {
            botao = criarDropdown(nav, item, tipoUsuario, 'funcionarios');
        } else if (item.nome === 'Sair') {
            sairBotao = criarBotao(item);
        } else {
            botao = criarBotao(item);
        }

        if (botao) nav.appendChild(botao);
    });

    // Sempre adiciona Tema e Sair no final
    nav.appendChild(dropdownTema);
    if (sairBotao) nav.appendChild(sairBotao);
}

function criarBotao(item) {
    const botao = document.createElement('button');
    botao.innerHTML = `<i class="${item.icone}"></i> ${item.nome}`;
    if (item.funcao) botao.addEventListener('click', item.funcao);
    return botao;
}

function criarDropdown(nav, item, tipoUsuario, tipo) {
    const dropdown = document.createElement('div');
    dropdown.classList.add('dropdown');

    const botao = document.createElement('button');
    botao.innerHTML = `<i class="${item.icone}"></i> ${item.nome}`;
    botao.onclick = () => toggleDropdownById(`dropdown-${tipo}-content`);
    dropdown.appendChild(botao);

    const content = document.createElement('div');
    content.classList.add('dropdown-content');
    content.id = `dropdown-${tipo}-content`;

    if (tipo === 'pacientes') {
        const visualizar = criarDropdownButton('Visualizar Pacientes', 'ri-eye-line', visualizar_pacientes);
        content.appendChild(visualizar);

        if (tipoUsuario >= 2) {
            const gerenciar = criarDropdownButton('Gerenciar Pacientes', 'ri-settings-3-line', gerenciar_paciente);
            content.appendChild(gerenciar);
        }
        if (tipoUsuario === 3) {
            const adicionar = criarDropdownButton('Adicionar Paciente', 'ri-user-add-line', cadastro_paciente);
            content.appendChild(adicionar);
        }
    } else if (tipo === 'funcionarios') {
        const visualizar = criarDropdownButton('Visualizar Funcionários', 'ri-eye-line', visualizar_funcionarios);
        content.appendChild(visualizar);
        if (tipoUsuario === TIPOS_USUARIO.HOSPITAL) {
            const cadastrar = criarDropdownButton('Cadastrar Funcionários', 'ri-user-add-line', cadastrar_funcionario);
            content.appendChild(cadastrar);
        }
    }

    dropdown.appendChild(content);
    return dropdown;
}

function criarDropdownButton(texto, icone, funcao) {
    const btn = document.createElement('button');
    btn.innerHTML = `<i class="${icone}"></i> ${texto}`;
    btn.onclick = funcao;
    return btn;
}

function toggleDropdownById(id) {
    const dropdown = document.getElementById(id);
    if (!dropdown) return;

    document.querySelectorAll('.dropdown-content').forEach(dc => {
        if (dc !== dropdown) dc.classList.remove('show');
    });

    dropdown.classList.toggle('show');
}

function closeDropdown() {
    document.querySelectorAll('.dropdown-content').forEach(dc => dc.classList.remove('show'));
}

function aplicarTemaSalvo() {
    const theme = sessionStorage.getItem('theme') || localStorage.getItem('theme');
    if (theme === 'dark') document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
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

function sair() {
    localStorage.removeItem('auth');
    localStorage.removeItem('theme');
    sessionStorage.removeItem('auth');
    sessionStorage.removeItem('theme');
    window.location.href = 'login.html';
}

function cadastro_paciente() { window.location.href = 'cadastro_paciente.html'; }
function gerenciar_paciente() { window.location.href = 'paciente.html'; }
function visualizar_pacientes() { window.location.href = 'mostrar_pacientes.html'; }
function visualizar_quartos() { window.location.href = 'mostrar_quartos.html'; }
function visualizar_funcionarios() { window.location.href = 'funcionarios.html'; }
function cadastrar_funcionario() { window.location.href = 'cadastro_funcionario.html'; }
function solicitacoes() { window.location.href = 'solicitacao.html'; }

function toggleMenu() {
    const nav = document.getElementById('nav-buttons');
    if (nav) nav.classList.toggle('show');
}

function configurarEventosClique() {
    window.onclick = function (event) {
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
}

document.addEventListener('DOMContentLoaded', function () {
    verificarAutenticacao();
    configurarNavegacao();
    aplicarTemaSalvo();
    configurarEventosClique();
    configurarLoadingScreen();
});
