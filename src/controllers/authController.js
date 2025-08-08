const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function loginGeral(req, res) {
    const { email, senha } = req.body;

    try {
        // Verifica no model User
        const usuario = await prisma.user.findUnique({ where: { email } });
        if (usuario && await bcrypt.compare(senha, usuario.senha)) {
            return res.status(200).json({
                message: 'Login realizado com sucesso (usuário)',
                tipo: 'usuario',
                usuario
            });
        }

        // Verifica no model Hospital
        const hospital = await prisma.hospital.findUnique({ where: { email } });
        if (hospital && await bcrypt.compare(senha, hospital.senha)) {
            return res.status(200).json({
                message: 'Login realizado com sucesso (hospital)',
                tipo: 'hospital',
                usuario: hospital
            });
        }

        return res.status(401).json({ error: 'Email ou senha inválidos' });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro no servidor' });
    }
}

module.exports = { loginGeral };
