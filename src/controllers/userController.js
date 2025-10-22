const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const ExcelJS = require('exceljs');
const fetch = require("node-fetch"); // importante

// ====================== FUNÇÃO AUXILIAR PARA ENVIO DE E-MAIL VIA BREVO ======================
async function enviarEmail(destinatario, assunto, texto) {
  try {
    const resposta = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": process.env.BREVO_API_KEY, // chave API do Brevo
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "HealthTrack",
          email: process.env.SENDER_EMAIL || "healthtrack.tcc@gmail.com", // pode ser Gmail ou domínio verificado
        },
        to: [{ email: destinatario }],
        subject: assunto,
        htmlContent: `<pre>${texto}</pre>`, // Brevo exige campo HTML
      }),
    });

    const data = await resposta.json();
    if (!resposta.ok) throw new Error(JSON.stringify(data));
    console.log(`📧 E-mail enviado via Brevo para ${destinatario}`);
  } catch (err) {
    console.error("❌ Erro ao enviar e-mail via Brevo:", err.message);
  }
}

// ====================== CADASTRO DE UM USUÁRIO ======================
async function registerUser(req, res) {
  const { nome, cpf, email, crm, uf, tipo_user, hospitalId, status_senha } = req.body;

  try {
    const senhaTemporaria = crypto.randomBytes(6).toString("hex");

    // Verificações de duplicidade
    const emailCheck = await prisma.user.findUnique({ where: { email } });
    if (emailCheck) return res.status(400).json({ error: 'Email já cadastrado.' });

    const hospitalEmailCheck = await prisma.hospital.findUnique({ where: { email } });
    if (hospitalEmailCheck) return res.status(400).json({ error: 'Email já cadastrado.' });

    const cpfCheck = await prisma.user.findUnique({ where: { cpf } });
    if (cpfCheck) return res.status(400).json({ error: 'CPF já cadastrado.' });

    const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

    const newUser = await prisma.user.create({
      data: {
        nome,
        cpf,
        email,
        senha: senhaHash,
        crm: crm && uf ? `${crm}/${uf}` : null,
        tipo_user,
        hospitalId,
        status_senha,
        status_cadastro: "pendente",
      },
    });

    // Cria solicitação de cadastro
    await prisma.solicitation.create({
      data: {
        userId: newUser.id,
        hospitalId,
        status: "pendente",
      },
    });

    // Envio de e-mail com senha temporária
    const assunto = "📬 Bem-vindo ao HealthTrack - Acesso ao Sistema";
    const texto = `Olá ${nome},

Seu usuário foi cadastrado com sucesso no HealthTrack!
Senha temporária: ${senhaTemporaria}

⚠️ Por motivos de segurança, altere sua senha no primeiro login.

Equipe HealthTrack`;

    await enviarEmail(email, assunto, texto);

    // Gera token JWT
    const token = jwt.sign(
      { id: newUser.id, tipo_user: newUser.tipo_user },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso!',
      usuario: newUser,
      token,
    });
  } catch (error) {
    console.error("❌ Erro detalhado ao cadastrar:", error);
    return res.status(500).json({
      error: 'Erro ao cadastrar usuário.',
      details: error.message || "Sem detalhes",
    });
  }
}

// ====================== CADASTRO EM LOTE VIA EXCEL ======================
async function registerUsersFromExcel(req, res) {
  try {
    const { hospitalId } = req.body;

    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo Excel enviado.' });
    if (!hospitalId) return res.status(400).json({ error: 'hospitalId é obrigatório.' });

    const hospitalExists = await prisma.hospital.findUnique({ where: { id: parseInt(hospitalId) } });
    if (!hospitalExists) return res.status(400).json({ error: 'Hospital não encontrado.' });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.worksheets[0];
    const data = [];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 1) {
        data.push({
          nome: row.getCell(1).value,
          cpf: row.getCell(2).value,
          email: row.getCell(3).value,
          crm: row.getCell(4).value,
          uf: row.getCell(5).value,
          tipo_user: row.getCell(6).value,
        });
      }
    });

    if (data.length === 0) return res.status(400).json({ error: 'O arquivo Excel está vazio ou formato incorreto.' });

    const results = { success: [], errors: [] };

    for (const [index, row] of data.entries()) {
      try {
        row.cpf = row.cpf?.toString().replace(/\D/g, '');
        const tipoUser = parseInt(row.tipo_user);

        const missingFields = ['nome', 'cpf', 'email', 'tipo_user'].filter(f => !row[f]);
        if (missingFields.length > 0) {
          results.errors.push({ linha: index + 2, error: `Campos obrigatórios faltando: ${missingFields.join(', ')}` });
          continue;
        }

        if (tipoUser === 3 && (!row.crm || !row.uf)) {
          results.errors.push({ linha: index + 2, error: 'Para médicos (tipo 3), CRM e UF são obrigatórios' });
          continue;
        }

        const emailCheck = await prisma.user.findUnique({ where: { email: row.email } });
        const cpfCheck = await prisma.user.findUnique({ where: { cpf: row.cpf } });
        if (emailCheck || cpfCheck) {
          results.errors.push({ linha: index + 2, error: 'E-mail ou CPF já cadastrado' });
          continue;
        }

        const senhaTemporaria = crypto.randomBytes(6).toString("hex");
        const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

        const newUser = await prisma.user.create({
          data: {
            nome: row.nome,
            cpf: row.cpf,
            email: row.email,
            senha: senhaHash,
            tipo_user: tipoUser,
            hospitalId: parseInt(hospitalId),
            status_senha: 1,
            crm: tipoUser === 3 ? `${row.crm}/${row.uf}` : null,
          },
        });

        const assunto = "📬 Bem-vindo ao HealthTrack - Acesso ao Sistema";
        const texto = `Olá ${row.nome},

Seu usuário foi cadastrado com sucesso no HealthTrack!
Senha temporária: ${senhaTemporaria}

⚠️ Por motivos de segurança, altere sua senha no primeiro login.

Equipe HealthTrack`;

        await enviarEmail(row.email, assunto, texto);

        results.success.push({ linha: index + 2, usuario: newUser.email, message: 'Usuário cadastrado com sucesso' });

      } catch (err) {
        results.errors.push({ linha: index + 2, error: err.message });
      }
    }

    return res.status(201).json({
      message: 'Processamento do arquivo concluído',
      total: data.length,
      sucessos: results.success.length,
      erros: results.errors.length,
      detalhes: results,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao processar arquivo Excel.' });
  }
}

// ====================== BUSCAR FUNCIONÁRIOS POR HOSPITAL ======================
async function getFuncionariosByHospital(req, res) {
  const { id } = req.params;

  try {
    const funcionarios = await prisma.user.findMany({ where: { hospitalId: Number(id) } });
    if (!funcionarios || funcionarios.length === 0)
      return res.status(404).json({ error: 'Nenhum funcionário encontrado.' });
    return res.status(200).json(funcionarios);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar funcionários.' });
  }
}

module.exports = {
  registerUser,
  getFuncionariosByHospital,
  registerUsersFromExcel,
};
