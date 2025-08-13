const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function loginGeral(req, res) {
    const { email, senha } = req.body;

    try {
        // 1. Primeiro tenta encontrar como usuário
        const usuario = await prisma.user.findUnique({ 
            where: { email } 
        });
        
        if (usuario) {
            const senhaValida = await bcrypt.compare(senha, usuario.senha);
            if (senhaValida) {
                return res.status(200).json({
                    message: 'Login realizado com sucesso (usuário)',
                    tipo: 'usuario',
                    dados: {
                        ...usuario,
                        tipo_user: usuario.tipo_user
                    }
                });
            }
        }

        // 2. Se não encontrou como usuário, tenta como hospital
        const hospital = await prisma.hospital.findUnique({ 
            where: { email } 
        });

        if (hospital) {
            const senhaValida = await bcrypt.compare(senha, hospital.senha);
            if (senhaValida) {
                return res.status(200).json({
                    message: 'Login realizado com sucesso (hospital)',
                    tipo: 'hospital',
                    dados: {
                        ...hospital,
                        tipo_user: 4 // Tipo fictício para hospital
                    }
                });
            }
        }

        // 3. Se não encontrou em nenhum, retorna erro
        return res.status(401).json({ error: 'Email ou senha inválidos' });

    } catch (err) {
        console.error('Erro no loginGeral:', err);
        return res.status(500).json({ 
            error: 'Erro no servidor',
            details: err.message 
        });
    }
}

module.exports = { loginGeral };