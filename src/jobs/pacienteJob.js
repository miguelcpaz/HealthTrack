const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Executa todo dia às 00:00
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('Atualizando estadia dos pacientes...');

    // Decrementa estadia de todos os pacientes com estadia > 0
    await prisma.paciente.updateMany({
      where: {
        estadia: {
          gt: 0
        }
      },
      data: {
        estadia: {
          decrement: 1
        }
      }
    });

    console.log('Estadias atualizadas com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar estadias:', error);
  }
});
