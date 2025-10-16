// Verificar se há preferência de tema salva
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
}

// Simular dados de autenticação para exemplo
const authData = {
    dados: {
        id: 1
    }
};

// Ocultar loading inicial após carregamento
window.addEventListener('load', function() {
    setTimeout(function() {
        document.getElementById('loading-screen').style.opacity = '0';
        setTimeout(function() {
            document.getElementById('loading-screen').style.display = 'none';
        }, 500);
    }, 1000);
});

// Função para mostrar/ocultar o loading do Excel
function toggleExcelLoading(show) {
    const loadingOverlay = document.getElementById('excel-loading');
    const mainElement = document.querySelector('main');
    
    if (show) {
        loadingOverlay.classList.add('active');
        mainElement.style.filter = 'blur(4px)';
    } else {
        loadingOverlay.classList.remove('active');
        mainElement.style.filter = 'none';
    }
}

// Alternar entre formulários
function showForm(type) {
    const singleOption = document.querySelector('.toggle-option:nth-child(1)');
    const multipleOption = document.querySelector('.toggle-option:nth-child(2)');
    const singleForm = document.getElementById('single-form');
    const multipleForm = document.getElementById('multiple-form');

    if (type === 'single') {
        singleOption.classList.add('active');
        multipleOption.classList.remove('active');
        singleForm.classList.add('active');
        multipleForm.classList.remove('active');
    } else {
        singleOption.classList.remove('active');
        multipleOption.classList.add('active');
        singleForm.classList.remove('active');
        multipleForm.classList.add('active');
    }
}

// Mostrar informações do arquivo selecionado
document.getElementById('file-input').addEventListener('change', function (e) {
    const fileInfo = document.getElementById('file-info');
    if (this.files.length > 0) {
        fileInfo.textContent = this.files[0].name;
    } else {
        fileInfo.textContent = 'Nenhum arquivo selecionado';
    }
});

// Submit do formulário único
document.getElementById('single-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const nome = document.getElementById('nome').value;
    const cpf = document.getElementById('cpf').value;
    const email = document.getElementById('email').value;
    const crm = document.getElementById('crm').value;
    const uf = document.getElementById('uf').value;
    const tipo_user = parseInt(document.getElementById('tipo_user').value);

    const hospitalId = authData.dados.id;

    try {
        const response = await fetch('/api/usuarios/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome,
                cpf,
                email,
                crm,
                uf,
                tipo_user,
                hospitalId,
                status_senha: 1
            })
        });

        if (response.ok) {
            alert('Usuário cadastrado com sucesso!');
            e.target.reset();
        } else {
            const erro = await response.json();
            alert('Erro ao cadastrar usuário: ' + erro.error);
        }
    } catch (err) {
        console.error(err);
        alert('Erro na comunicação com o servidor.');
    }
});

// Submit do formulário múltiplo
document.getElementById('multiple-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const fileInput = document.getElementById('file-input');
    if (!fileInput.files.length) {
        alert('Por favor, selecione um arquivo Excel.');
        return;
    }

    const hospitalId = authData.dados.id;
    toggleExcelLoading(true);

    try {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Simulação de processamento

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('hospitalId', hospitalId);
        
        const response = await fetch('/api/usuarios/register-from-excel', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(`Cadastro em lote concluído!\nSucessos: ${result.sucessos}\nErros: ${result.erros}`);
        } else {
            alert('Erro ao processar arquivo: ' + result.error);
        }
        
        fileInput.value = '';
        document.getElementById('file-info').textContent = 'Nenhum arquivo selecionado';
        
    } catch (err) {
        console.error(err);
        alert('Erro na comunicação com o servidor.');
    } finally {
        toggleExcelLoading(false);
    }
});

// Máscara para CPF
document.getElementById('cpf').addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 9) {
        value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
        value = value.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
    } else if (value.length > 3) {
        value = value.replace(/(\d{3})(\d+)/, '$1.$2');
    }
    e.target.value = value;
});

// Download modelo Excel
function downloadExcelModel() {
    const link = document.createElement('a');
    link.href = './modelos/modelo_funcionarios_base.xlsx';
    link.download = 'modelo_funcionarios_base.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Controle de tema
function setDarkMode() {
    document.body.classList.add('dark-mode');
    localStorage.setItem('theme', 'dark');
}

function setLightMode() {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light');
}

// Dropdown e menu
function toggleDropdown() {
    const dropdown = document.getElementById('dropdown-content');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function toggleMenu() {
    const nav = document.getElementById('nav-buttons');
    nav.classList.toggle('show');
}

window.onclick = function(event) {
    if (!event.target.matches('nav button')) {
        const dropdown = document.getElementById('dropdown-content');
        if (dropdown && dropdown.style.display === 'block') {
            dropdown.style.display = 'none';
        }
    }
}
