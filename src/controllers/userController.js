const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { Resend } = require("resend");
const jwt = require("jsonwebtoken");
const ExcelJS = require('exceljs');

const resend = new Resend(process.env.RESEND_API_KEY);

// Função auxiliar para envio de e-mails via Resend
async function enviarEmail(destinatario, assunto, texto) {
  try {
    await resend.emails.send({
      from: "HealthTrack <onboarding@resend.dev>",
      to: destinatario,
      subject: assunto,
      text: texto,
    });
    console.log(`📧 E-mail enviado para ${destinatario}`);
  } catch (err) {
    console.error("❌ Erro ao enviar e-mail:", err);
  }
}

// ====================== CADASTRO DE UM USUÁRIO ======================
async function registerUser(req, res) {
  const { nome, cpf, email, crm, uf, tipo_user, hospitalId, status_senha } = req.body;

  try {
    const senhaTemporaria = crypto.randomBytes(6).toString("hex");

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
        status_cadastro: "pendente"
      }
    });

    // Cria solicitação de cadastro para o hospital
    await prisma.solicitation.create({
      data: {
        userId: newUser.id,
        hospitalId,
        status: "pendente"
      }
    });

    // Envio de e-mail com senha temporária
    const assunto = "📬 Bem-vindo ao HealthTrack - Acesso ao Sistema";
    const texto = `Olá ${nome},

Seu usuário foi cadastrado com sucesso no HealthTrack!
Senha temporária: ${senhaTemporaria}

⚠️ Por motivos de segurança, altere sua senha no primeiro login.

Equipe HealthTrack`;

    await enviarEmail(email, assunto, texto);

    // Gerar token JWT seguro
    const token = jwt.sign(
      { id: newUser.id, tipo_user: newUser.tipo_user },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso!',
      usuario: newUser,
      token
    });
  } catch (error) {
    console.error("❌ Erro detalhado ao cadastrar:", error);
    return res.status(500).json({
      error: 'Erro ao cadastrar usuário.',
      details: error.message || "Sem detalhes"
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
          tipo_user: row.getCell(6).value
        });
      }
    });

    if (data.length === 0) return res.status(400).json({ error: 'O arquivo Excel está vazio ou formato incorreto.' });

    const results = { success: [], errors: [] };

    for (const [index, row] of data.entries()) {
      try {
        // Normalizar CPF
        if (row.cpf) row.cpf = row.cpf.toString().replace(/\D/g, '');

        // Validar campos obrigatórios
        const tipoUser = parseInt(row.tipo_user);
        const baseRequiredFields = ['nome', 'cpf', 'email', 'tipo_user'];
        const missingFields = baseRequiredFields.filter(f => !row[f]);
        if (missingFields.length > 0) {
          results.errors.push({ linha: index + 2, error: `Campos obrigatórios faltando: ${missingFields.join(', ')}` });
          continue;
        }

        if (tipoUser === 3) {
          const medicoFields = ['crm', 'uf'];
          const missingMedicoFields = medicoFields.filter(f => !row[f]);
          if (missingMedicoFields.length > 0) {
            results.errors.push({ linha: index + 2, error: `Para médicos (tipo 3), campos obrigatórios faltando: ${missingMedicoFields.join(', ')}` });
            continue;
          }
        }

        // Verificar duplicados
        const emailCheck = await prisma.user.findUnique({ where: { email: row.email } });
        const cpfCheck = await prisma.user.findUnique({ where: { cpf: row.cpf } });
        if (emailCheck || cpfCheck) {
          results.errors.push({ linha: index + 2, error: 'E-mail ou CPF já cadastrado' });
          continue;
        }

        // Criar usuário
        const senhaTemporaria = crypto.randomBytes(6).toString("hex");
        const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

        const userData = {
          nome: row.nome,
          cpf: row.cpf,
          email: row.email,
          senha: senhaHash,
          tipo_user: tipoUser,
          hospitalId: parseInt(hospitalId),
          status_senha: 1,
          crm: tipoUser === 3 && row.crm && row.uf ? `${row.crm}/${row.uf}` : null
        };

        const newUser = await prisma.user.create({ data: userData });

        // Enviar e-mail via Resend
        const assunto = "📬 Bem-vindo ao HealthTrack - Acesso ao Sistema";
        const texto = `Olá ${row.nome},

Seu usuário foi cadastrado com sucesso no HealthTrack!
Senha temporária: ${senhaTemporaria}

⚠️ Por motivos de segurança, altere sua senha no primeiro login.

Equipe HealthTrack`;

        await enviarEmail(row.email, assunto, texto);

        // Gerar token JWT para cada usuário (opcional)
        const token = jwt.sign(
          { id: newUser.id, tipo_user: newUser.tipo_user },
          process.env.JWT_SECRET,
          { expiresIn: "8h" }
        );

        results.success.push({ linha: index + 2, usuario: newUser.email, token, message: 'Usuário cadastrado com sucesso' });

      } catch (err) {
        results.errors.push({ linha: index + 2, error: `Erro ao processar linha: ${err.message}` });
      }
    }

    return res.status(201).json({
      message: 'Processamento do arquivo concluído',
      total: data.length,
      sucessos: results.success.length,
      erros: results.errors.length,
      detalhes: results
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
    if (!funcionarios || funcionarios.length === 0) return res.status(404).json({ error: 'Nenhum funcionario encontrado.' });
    return res.status(200).json(funcionarios);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar funcionarios.' });
  }
}

module.exports = {
  registerUser,
  getFuncionariosByHospital,
  registerUsersFromExcel
};
