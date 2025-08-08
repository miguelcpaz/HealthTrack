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