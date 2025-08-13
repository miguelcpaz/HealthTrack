const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Cadastro de paciente
async function registerPaciente(req, res) {
  const { nome, idade, sexo, nivelalerta, relatorio, prescricao, estadia, quarto, hospitalId } = req.body;

  try {
    await prisma.paciente.create({
      data: {
        nome,
        idade,
        sexo,
        nivelalerta,
        relatorio,
        prescricao,
        estadia,
        quarto,
        hospitalId
      }
    });

    return res.status(201).json({ message: 'Paciente cadastrado com sucesso!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao cadastrar paciente.' });
  }
}

// Buscar todos pacientes
async function getPacientes(req, res) {
  const hospitalId = req.body;
  try {
    const pacientes = await prisma.paciente.findMany();
    return res.status(200).json(pacientes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar pacientes.' });
  }
}

// Buscar paciente por ID
async function getPacientesByHospital(req, res) {
  const { id } = req.params; // hospitalId

  try {
    const pacientes = await prisma.paciente.findMany({
      where: { hospitalId: Number(id) }
    });

    if (!pacientes || pacientes.length === 0) {
      return res.status(404).json({ error: 'Nenhum paciente encontrado para este hospital.' });
    }
    return res.status(200).json(pacientes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar pacientes.' });
  }
}


// Editar paciente
async function editPaciente(req, res) {
  const { id, nome, idade, sexo, nivelalerta, relatorio, prescricao, estadia, quarto } = req.body;

  try {
    const pacienteAtualizado = await prisma.paciente.update({
      where: { id: Number(id) },
      data: {
        nome: nome !== undefined ? nome : undefined,
        idade: idade !== undefined ? idade : undefined,
        sexo: sexo !== undefined ? sexo : undefined,
        nivelalerta: nivelalerta !== undefined ? nivelalerta : undefined,
        relatorio: relatorio !== undefined ? relatorio : undefined,
        prescricao: prescricao !== undefined ? prescricao : undefined,
        estadia: estadia !== undefined ? estadia : undefined,
        quarto: quarto !== undefined ? quarto : undefined,
      }
    });

    return res.status(200).json({ message: 'Paciente atualizado com sucesso.', paciente: pacienteAtualizado });
  } catch (error) {
    console.error('Erro ao atualizar paciente:', error);

    if (error.code === 'P2025') { // Prisma not found error code
      return res.status(404).json({ error: 'Paciente não encontrado.' });
    }

    return res.status(500).json({ error: 'Erro ao atualizar paciente.' });
  }
}

module.exports = {
  registerPaciente,
  getPacientes,
  getPacientesByHospital,
  editPaciente,
};
