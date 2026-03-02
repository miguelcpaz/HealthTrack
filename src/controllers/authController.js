const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function loginGeral(req, res) {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    try {
        
        const usuario = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                nome: true,
                email: true,
                senha: true,
                tipo_user: true,
                status_cadastro: true
            }
        });

        if (usuario) {

            if (usuario.status_cadastro === "pendente") {
                return res.status(403).json({
                    error: "Seu cadastro ainda não foi aprovado pelo hospital"
                });
            }

            const senhaValida = await bcrypt.compare(senha, usuario.senha);

            if (!senhaValida) {
                return res.status(401).json({ error: "Email ou senha inválidos" });
            }

            const token = jwt.sign(
                { id: usuario.id, tipo: "usuario" },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            return res.status(200).json({
                message: "Login realizado com sucesso",
                token,
                dados: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    tipo_user: usuario.tipo_user
                }
            });
        }

        
        const hospital = await prisma.hospital.findUnique({
            where: { email },
            select: {
                id: true,
                nome: true,
                email: true,
                senha: true
            }
        });

        if (hospital) {
            const senhaValida = await bcrypt.compare(senha, hospital.senha);

            if (!senhaValida) {
                return res.status(401).json({ error: "Email ou senha inválidos" });
            }

            const token = jwt.sign(
                { id: hospital.id, tipo: "hospital" },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            return res.status(200).json({
                message: "Login realizado com sucesso",
                token,
                dados: {
                    id: hospital.id,
                    nome: hospital.nome,
                    email: hospital.email,
                    tipo_user: 4
                }
            });
        }

        return res.status(401).json({ error: "Email ou senha inválidos" });

    } catch (err) {
        console.error("Erro no login:", err);
        return res.status(500).json({
            error: "Erro interno do servidor"
        });
    }
}

async function trocar_senhatemp(req, res) {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
            error: "A nova senha deve ter pelo menos 6 caracteres"
        });
    }

    try {
        
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Não autorizado" });
        }

        const token = authHeader.split(" ")[1];

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ error: "Token inválido ou expirado" });
        }

        const senhaHash = await bcrypt.hash(newPassword, 10);

        if (decoded.tipo === "usuario") {
            await prisma.user.update({
                where: { id: decoded.id },
                data: {
                    senha: senhaHash,
                    status_senha: 0
                }
            });
        }

        if (decoded.tipo === "hospital") {
            await prisma.hospital.update({
                where: { id: decoded.id },
                data: {
                    senha: senhaHash,
                    status_senha: 0
                }
            });
        }

        return res.status(200).json({
            message: "Senha atualizada com sucesso"
        });

    } catch (error) {
        console.error("Erro ao atualizar senha:", error);
        return res.status(500).json({
            error: "Erro interno do servidor"
        });
    }
}


module.exports = { loginGeral, trocar_senhatemp };