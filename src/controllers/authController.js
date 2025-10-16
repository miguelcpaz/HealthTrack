const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function loginGeral(req, res) {
    const { email, senha } = req.body;

    try {

        console.log('Dados de login recebidos:', { email, senha });

        const usuario = await prisma.user.findUnique({ 
            where: { email } 
        });
        
        if (usuario) {
             if (usuario.status_cadastro === "pendente") {
                return res.status(403).json({
                    error: 'Seu cadastro ainda não foi aprovado pelo hospital'
                });
            }

            const senhaValida = await bcrypt.compare(senha, usuario.senha);
            if (senhaValida) {
                return res.status(200).json({
                    message: 'Login realizado com sucesso (usuário)',
                    tipo: 'usuario',
                    dados: { ...usuario, tipo_user: usuario.tipo_user }
                });
            }
        }

 
        const hospital = await prisma.hospital.findUnique({ 
            where: { email } 
        });

        if (hospital) {
            const senhaValida = await bcrypt.compare(senha, hospital.senha);
            console.log('Password valid?', senhaValida); 
            if (senhaValida) {
                return res.status(200).json({
                    message: 'Login realizado com sucesso (hospital)',
                    tipo: 'hospital',
                    dados: {
                        ...hospital,
                        tipo_user: 4 
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
    const { email } = req.params; // Obtém o email dos parâmetros da URL
    const { newPassword } = req.body;


    // Verifica se o email foi fornecido
    if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório'});
    }

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
    }

    try {
        const senhaHash = await bcrypt.hash(newPassword, 10);

        // Primeiro verifica se é um usuário
        let user = await prisma.user.findUnique({ 
            where: { email: email } // Certifica-se de que o email está sendo passado
        });

        if (user) {
            // Atualiza usuário
            const updatedUser = await prisma.user.update({
                where: { email: email },
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

        // Se não for usuário, verifica se é um hospital
        let hospital = await prisma.hospital.findUnique({ 
            where: { email: email }
        });

        if (hospital) {
            const updatedHospital = await prisma.hospital.update({
                where: { email: email },
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
        }

        // Se não encontrou nem usuário nem hospital
        return res.status(404).json({ error: 'Email não encontrado', email});

    } catch (error) {
        console.error('Erro ao atualizar senha temporária:', error);
        return res.status(500).json({ 
            error: 'Erro ao atualizar a senha',
            details: error.message 
        });
    }
}



module.exports = { loginGeral, trocar_senhatemp };