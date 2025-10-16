const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function postUser(user) {
    await prisma.user.create({
        data: user
    });
}

async function selectUsers() {
    return await prisma.user.findMany();
}

async function selectUser(id) {
    return await prisma.user.findUnique({
        where: { id: Number(id) }
    });
}

async function selectUserByEmail(email) {
    return await prisma.user.findUnique({
        where: { email }
    });
}

async function selectUserByCpf(cpf) {
    return await prisma.user.findUnique({
        where: { cpf }
    });
}

async function updateUser(id, user) {
    await prisma.user.update({
        where: { id: Number(id) },
        data: {
            nome: user.nome,
            email: user.email,
            senha: user.senha
        }
    });
}

async function deleteUser(id) {
    await prisma.user.delete({
        where: { id: Number(id) }
    });
}

module.exports = {
    postUser,
    selectUsers,
    selectUser,
    selectUserByEmail,
    selectUserByCpf,
    updateUser,
    deleteUser
};
