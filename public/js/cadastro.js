function showForm(formId) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.form-area').forEach(form => form.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(formId).classList.add('active');
}

// Captura todos os formulários
const forms = document.querySelectorAll("form");

forms.forEach(form => {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        let tipo_user;
        if (form.id === "tecnico") tipo_user = 1;
        else if (form.id === "enfermeiro") tipo_user = 2;
        else if (form.id === "medico") tipo_user = 3;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const user = {
            nome: data[`nome_${form.id}`],
            cpf: data[`cpf_${form.id}`],
            email: data[`email_${form.id}`],
            senha: data[`senha_${form.id}`],
            crm: data[`crm_medico`] ? data[`crm_medico`] : null,
            tipo_user
        };

        console.log(user);

        try {
            const response = await fetch("/api/usuarios", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(user)
            });


            if (response.ok) {
                alert("Usuário cadastrado com sucesso!");
                form.reset();
                window.location.href = 'index.html';
            } else {
                alert("Erro ao cadastrar usuário.");
            }
        } catch (error) {
            console.error(error);
            alert("Erro ao conectar com o servidor.");
        }
    });
});
// Máscaras de entrada
function mascaraCPF(input) {
  let value = input.value.replace(/\D/g, '');
  if (value.length > 11) value = value.slice(0, 11);
  if (value.length > 9)
    value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  else if (value.length > 6)
    value = value.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
  else if (value.length > 3)
    value = value.replace(/(\d{3})(\d+)/, '$1.$2');
  input.value = value;
}

function mascaraCNPJ(input) {
  let value = input.value.replace(/\D/g, '');
  if (value.length > 14) value = value.slice(0, 14);
  if (value.length > 12)
    value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  else if (value.length > 8)
    value = value.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
  else if (value.length > 5)
    value = value.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
  else if (value.length > 2)
    value = value.replace(/(\d{2})(\d+)/, '$1.$2');
  input.value = value;
}

function mascaraCEP(input) {
  let value = input.value.replace(/\D/g, '');
  if (value.length > 8) value = value.slice(0, 8);
  if (value.length > 5) value = value.replace(/(\d{5})(\d+)/, '$1-$2');
  input.value = value;
}

function mascaraTelefone(input) {
  let value = input.value.replace(/\D/g, '');
  if (value.length > 11) value = value.slice(0, 11);
  if (value.length > 10)
    value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  else if (value.length > 6)
    value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  else if (value.length > 2)
    value = value.replace(/(\d{2})(\d+)/, '($1) $2');
  input.value = value;
}

// Alternar formulários
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

// Carregar hospitais
async function carregarHospitais() {
  try {
    const response = await fetch('http://localhost:3000/api/hospital/listar');
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

// Submissão dos formulários
document.querySelectorAll('form').forEach(form => {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    let tipo_user;

    if (form.id === 'tecnico') tipo_user = 1;
    else if (form.id === 'enfermeiro') tipo_user = 2;
    else if (form.id === 'medico') tipo_user = 3;

    // Cadastro de hospital
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

      try {
        const response = await fetch('http://localhost:3000/api/hospital/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(hospital),
        });

        if (response.ok) {
          alert('Hospital cadastrado! Uma senha temporária foi enviada para o email informado.');
          form.reset();
          window.location.href = '//localhost:3000';
        } else {
          const errorData = await response.json();
          alert(errorData.error || 'Erro ao cadastrar hospital.');
        }
      } catch (error) {
        console.error(error);
        alert('Erro ao conectar com o servidor.');
      }
    } else {
      // Cadastro de técnico, enfermeiro ou médico
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

      try {
        const response = await fetch('http://localhost:3000/api/usuarios/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        });

        if (response.ok) {
          alert('Usuário cadastrado com sucesso! Uma senha temporária foi enviada para o email informado.');
          form.reset();
          window.location.href = '//localhost:3000';
        } else {
          const errorData = await response.json();
          alert(errorData.error || 'Erro ao cadastrar usuário.');
        }
      } catch (error) {
        console.error(error);
        alert('Erro ao conectar com o servidor.');
      }
    }
  });
});

// Loading
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
