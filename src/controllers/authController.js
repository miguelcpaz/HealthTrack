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

async function trocar_senhatemp(req, res) {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
    }

    try {
        const senhaHash = await bcrypt.hash(newPassword, 10);

        let user = await prisma.user.findUnique({ where: { id: Number(id) } });

        if (user) {
            // Atualiza usuário
            const updatedUser = await prisma.user.update({
                where: { id: Number(id) },
                data: {
                    senha: senhaHash,
                    status_senha: 0
                }
            });

            return res.status(200).json({
                message: 'Senha atualizada com sucesso!',
                authAtualizado: {
                    dados: updatedUser,
                    tipo: 'usuario'
                }
            });
        }

        let hospital = await prisma.hospital.findUnique({ where: { id: Number(id) } });
        if (!hospital) {
            return res.status(404).json({ error: 'Usuário ou hospital não encontrado' });
        }

        const updatedHospital = await prisma.hospital.update({
            where: { id: Number(id) },
            data: {
                senha: senhaHash,
                status_senha: 0
            }
        });

        return res.status(200).json({
            message: 'Senha atualizada com sucesso!',
            authAtualizado: {
                dados: updatedHospital,
                tipo: 'hospital'
            }
        });

    } catch (error) {
        console.error('Erro ao atualizar senha temporária:', error);
        return res.status(500).json({ error: 'Erro ao atualizar a senha' });
    }
}



module.exports = { loginGeral, trocar_senhatemp };