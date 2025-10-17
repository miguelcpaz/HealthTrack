const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const ExcelJS = require('exceljs'); // Usando exceljs

async function registerUser(req, res) {
  const { nome, cpf, email, crm, uf, tipo_user, hospitalId, status_senha } = req.body;

  console.log()

  try {
    const senhaTemporaria = crypto.randomBytes(6).toString("hex");

    const emailCheck = await prisma.user.findUnique({ where: { email } });
    if (emailCheck) {
      return res.status(400).json({ error: 'Email já cadastrado.' });
    }

    const hospitalEmailCheck = await prisma.hospital.findUnique({ where: { email } });
    if (hospitalEmailCheck) {
      return res.status(400).json({ error: 'Email já cadastrado.' });
    }

    const cpfCheck = await prisma.user.findUnique({ where: { cpf } });
    if (cpfCheck) {
      return res.status(400).json({ error: 'CPF já cadastrado.' });
    }

    const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

    const newUser = await prisma.user.create({
  data: {
    nome,
    cpf,
    email,
    senha: senhaHash,
    crm: `${crm}/${uf}`,
    tipo_user,
    hospitalId,
    status_senha,
    status_cadastro: "pendente" // novo campo
  }
});

// cria solicitação de cadastro para o hospital
await prisma.solicitation.create({
  data: {
    userId: newUser.id,
    hospitalId,
    status: "pendente"
  }
});


    const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === "true", // false para 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // app password do Gmail
  },
  tls: {
    rejectUnauthorized: false, // necessário em alguns servidores cloud
  },
});

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "📬 Bem-vindo ao HealthTrack - Acesso ao Sistema",
      text: `Olá,
    
    Seja bem-vindo ao HealthTrack!
    
    O seu Usuario foi cadastrado com sucesso em nossa plataforma. Para acessar o sistema, utilize as credenciais temporárias abaixo:
    
    🔐 Senha temporária de acesso: ${senhaTemporaria}
    
    ⚠️ Por razões de segurança, é extremamente importante que você altere essa senha assim que realizar o primeiro login.
    
    Através da plataforma, você poderá:
    - Gerenciar pacientes de forma rápida e segura;
    - Acompanhar internações, prescrições e relatórios clínicos;
    - Organizar sua equipe e muito mais.
    
    Caso você não tenha solicitado este cadastro, ou tenha recebido este e-mail por engano, por favor, entre em contato com a nossa equipe imediatamente.
    
    Se precisar de ajuda, conte com nosso suporte:
    
    📧 healthtrack.tcc@gmail.com 
    
    Obrigado por confiar na nossa solução.
    
    Atenciosamente,  
    Equipe HealthTrack

    MENSAGEM AUTOMATICA NÃO RESPONDA!
    `,
    };


    await transporter.sendMail(mailOptions);

    return res.status(201).json({ message: 'Usuário cadastrado com sucesso!', usuario: newUser });
  } catch (error) {
  console.error("❌ Erro detalhado ao cadastrar:", error);
  return res.status(500).json({ error: 'Erro ao cadastrar usuário.', details: error.message });
}

}

async function registerUsersFromExcel(req, res) {
  try {
    const { hospitalId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo Excel enviado.' });
    }

    if (!hospitalId) {
      return res.status(400).json({ error: 'hospitalId é obrigatório.' });
    }

    // Verificar se o hospital existe
    const hospitalExists = await prisma.hospital.findUnique({
      where: { id: parseInt(hospitalId) }
    });

    if (!hospitalExists) {
      return res.status(400).json({ error: 'Hospital não encontrado.' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    
    const worksheet = workbook.worksheets[0];
    const data = [];

    // Ler dados da planilha
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 1) { // Pular cabeçalho (linha 1)
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

    if (data.length === 0) {
      return res.status(400).json({ error: 'O arquivo Excel está vazio ou formato incorreto.' });
    }

    const results = {
      success: [],
      errors: []
    };

    for (const [index, row] of data.entries()) {
      try {
        // Normalizar CPF - remover tudo que não é número
        if (row.cpf) {
          row.cpf = row.cpf.toString().replace(/\D/g, '');
        }

        // Validação dos campos obrigatórios baseados no tipo_user
        const tipoUser = parseInt(row.tipo_user);
        
        if (isNaN(tipoUser) || tipoUser < 1 || tipoUser > 3) {
          results.errors.push({
            linha: index + 2,
            error: 'tipo_user deve ser um número entre 1 e 3'
          });
          continue;
        }

        // Campos obrigatórios base para todos os usuários
        const baseRequiredFields = ['nome', 'cpf', 'email', 'tipo_user'];
        const missingBaseFields = baseRequiredFields.filter(field => !row[field]);
        
        if (missingBaseFields.length > 0) {
          results.errors.push({
            linha: index + 2,
            error: `Campos obrigatórios faltando: ${missingBaseFields.join(', ')}`
          });
          continue;
        }

        // Validação de formato do CPF (deve ter 11 dígitos após normalização)
        if (row.cpf.length !== 11) {
          results.errors.push({
            linha: index + 2,
            error: 'CPF deve conter 11 dígitos'
          });
          continue;
        }

        // Campos específicos para médicos (tipo 3)
        if (tipoUser === 3) {
          const medicoRequiredFields = ['crm', 'uf'];
          const missingMedicoFields = medicoRequiredFields.filter(field => !row[field]);
          
          if (missingMedicoFields.length > 0) {
            results.errors.push({
              linha: index + 2,
              error: `Para médicos (tipo 3), campos obrigatórios faltando: ${missingMedicoFields.join(', ')}`
            });
            continue;
          }
        }

        // Validação de email único
        const emailCheck = await prisma.user.findUnique({ where: { email: row.email } });
        if (emailCheck) {
          results.errors.push({
            linha: index + 2,
            error: 'Email já cadastrado'
          });
          continue;
        }

        const hospitalEmailCheck = await prisma.hospital.findUnique({ where: { email: row.email } });
        if (hospitalEmailCheck) {
          results.errors.push({
            linha: index + 2,
            error: 'Email já cadastrado (hospital)'
          });
          continue;
        }

        // Validação de CPF único (usando CPF normalizado)
        const cpfCheck = await prisma.user.findUnique({ where: { cpf: row.cpf } });
        if (cpfCheck) {
          results.errors.push({
            linha: index + 2,
            error: 'CPF já cadastrado'
          });
          continue;
        }

        // Geração de senha temporária
        const senhaTemporaria = crypto.randomBytes(6).toString("hex");
        const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

        // Preparar dados para criação do usuário
        const userData = {
          nome: row.nome,
          cpf: row.cpf, // CPF já normalizado
          email: row.email,
          senha: senhaHash,
          tipo_user: tipoUser,
          hospitalId: parseInt(hospitalId),
          status_senha: 1
        };

        // Adicionar CRM apenas para médicos
        if (tipoUser === 3 && row.crm && row.uf) {
          userData.crm = `${row.crm}/${row.uf}`;
        }

        // Criação do usuário
        const newUser = await prisma.user.create({
          data: userData
        });

        // Envio de email
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          secure: process.env.EMAIL_SECURE === "true",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: row.email,
          subject: "📬 Bem-vindo ao HealthTrack - Acesso ao Sistema",
          text: `Olá,
    
Seja bem-vindo ao HealthTrack!

O seu Usuario foi cadastrado com sucesso em nossa plataforma. Para acessar o sistema, utilize as credenciais temporárias abaixo:

🔐 Senha temporária de acesso: ${senhaTemporaria}

⚠️ Por razões de segurança, é extremamente importante que você altere essa senha assim que realizar o primeiro login.

Através da plataforma, você poderá:
- Gerenciar pacientes de forma rápida e segura;
- Acompanhar internações, prescrições e relatórios clínicos;
- Organizar sua equipe e muito mais.

Caso você não tenha solicitado este cadastro, ou tenha recebido este e-mail por engano, por favor, entre em contato com a nossa equipe imediatamente.

Se precisar de ajuda, conte com nosso suporte:

📧 healthtrack.tcc@gmail.com 

Obrigado por confiar na nossa solução.

Atenciosamente,  
Equipe HealthTrack

MENSAGEM AUTOMATICA NÃO RESPONDA!
`,
        };

        await transporter.sendMail(mailOptions);

        results.success.push({
          linha: index + 2,
          usuario: newUser.email,
          message: 'Usuário cadastrado com sucesso'
        });

      } catch (error) {
        results.errors.push({
          linha: index + 2,
          error: `Erro ao processar linha: ${error.message}`
        });
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

async function loginUser(req, res) {
  const { email, senha } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ error: 'Usuário não encontrado.' });
    }

    if (user.senha !== senha) {
      return res.status(401).json({ error: 'Senha incorreta.' });
    }

    return res.status(200).json({
      message: 'Login realizado com sucesso!',
      usuario: user
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao tentar fazer login.' });
  }
}

async function getFuncionariosByHospital(req, res) {
  const { id } = req.params;

  try {
    const funcionarios = await prisma.user.findMany({
      where: { hospitalId: Number(id) }
    });

    if (!funcionarios || funcionarios.length === 0) {
      return res.status(404).json({ error: 'Nenhum funcionario encontrado para este hospital.' });
    }
    return res.status(200).json(funcionarios);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar funcionarios.' });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getFuncionariosByHospital,
  registerUsersFromExcel
};
