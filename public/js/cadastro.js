// ===============================
// Função para alternar formulários
// ===============================
function showForm(formId, event) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.form-area').forEach(form => form.classList.remove('active'));

  event.target.classList.add('active');
  document.getElementById(formId).classList.add('active');

  if (formId === 'hospital') {
    document.body.style.overflowX = 'hidden';
    document.body.style.overflowY = 'auto';
  } else {
    document.body.style.overflow = 'hidden';
  }
}

document.body.style.overflow = 'hidden';

// ===============================
// Funções de máscara
// ===============================
function mascaraCPF(input) { /* ... */ }
function mascaraCNPJ(input) { /* ... */ }
function mascaraCEP(input) { /* ... */ }
function mascaraTelefone(input) { /* ... */ }

// ===============================
// Carregar hospitais no select
// ===============================
async function carregarHospitais() {
  try {
    const response = await fetch('/api/hospital/listar');
    const hospitais = await response.json();

    const selects = document.querySelectorAll('select[name^="hospital_"]');
    selects.forEach(select => {
      select.innerHTML = '';
      hospitais.forEach(hospital => {
        const option = document.createElement('option');
        option.value = hospital.id;
        option.textContent = hospital.nomeFormatado;
        select.appendChild(option);
      });
    });
  } catch (error) {
    console.error('Erro ao carregar hospitais:', error);
    alert('Não foi possível carregar os hospitais.');
  }
}
carregarHospitais();

// ===============================
// Mini loader
// ===============================
const miniLoader = document.getElementById('mini-loader');
function showMiniLoader() {
  miniLoader.classList.remove('hidden');
  miniLoader.classList.add('active');
}
function hideMiniLoader() {
  miniLoader.classList.remove('active');
  setTimeout(() => miniLoader.classList.add('hidden'), 300);
}

// ===============================
// Submissão de formulários
// ===============================
document.querySelectorAll('form').forEach(form => {
  form.addEventListener('submit', async e => {
    e.preventDefault();

    showMiniLoader(); // <-- Mostra o mini loader

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    let tipo_user;

    if (form.id === 'tecnico') tipo_user = 1;
    else if (form.id === 'enfermeiro') tipo_user = 2;
    else if (form.id === 'medico') tipo_user = 3;

    try {
      if (form.id === 'hospital') {
        const hospital = {
          nome: data['nome_hospital'],
          cnpj: data['cnpj_hospital'].replace(/\D/g, ''),
          cnes: data['cnes_hospital'],
          cep: data['cep_hospital'].replace(/\D/g, ''),
          numero: data['numero_hospital'],
          telefone: data['telefone_hospital'].replace(/\D/g, ''),
          email: data['email_hospital'],
          website: data['website_hospital'] || null,
          tipoEstabelecimento: data['tipoEstabelecimento_hospital'],
          status_senha: 1,
        };

        const response = await fetch('/api/hospital/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(hospital),
        });

        if (response.ok) {
          alert('Hospital cadastrado! Uma senha temporária foi enviada para o email informado.');
          form.reset();
          window.location.href = '/';
        } else {
          const errorData = await response.json().catch(() => ({}));
          alert(errorData.details || errorData.error || 'Erro ao cadastrar hospital.');
        }
      } else {
        const hospitalId = data[`hospital_${form.id}`];
        const user = {
          nome: data[`nome_${form.id}`],
          cpf: data[`cpf_${form.id}`].replace(/\D/g, ''),
          email: data[`email_${form.id}`],
          crm: form.id === 'medico' ? data[`crm_medico`] : null,
          uf: form.id === 'medico' ? data[`uf_medico`] : null,
          tipo_user,
          hospitalId: parseInt(hospitalId),
          status_senha: 1,
        };

        const response = await fetch('/api/usuarios/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        });

        if (response.ok) {
          alert('Usuário cadastrado com sucesso! Uma senha temporária foi enviada para o email informado.');
          form.reset();
          window.location.href = '/';
        } else {
          const errorData = await response.json().catch(() => ({}));
          alert(errorData.details || errorData.error || 'Erro ao cadastrar usuário.');
        }
      }
    } catch (error) {
      console.error('❌ Erro de conexão com servidor:', error);
      alert('Erro ao conectar com o servidor.');
    } finally {
      hideMiniLoader(); // <-- Oculta o mini loader
    }
  });
});

// ===============================
// Tela de loading principal
// ===============================
window.addEventListener('load', function () {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    const randomDelay = Math.floor(Math.random() * (2500 - 1000 + 1)) + 1000;
    setTimeout(() => {
      loadingScreen.style.opacity = '0';
      setTimeout(() => (loadingScreen.style.display = 'none'), 500);
    }, randomDelay);
  }
});
