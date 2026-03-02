const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

async function getPacientesCriticosByHospital(req, res) {
  const { hospitalId } = req.params;

  try {
    const pacientes = await prisma.paciente.findMany({
      where: { 
        hospitalId: Number(hospitalId),
        nivelalerta: {
          in: ["Vermelho", "Laranja"]
        }
      },
      orderBy: {
        nivelalerta: 'desc' // Ordena por nível de alerta (Vermelho primeiro)
      }
    });

    if (!pacientes || pacientes.length === 0) {
      return res.status(404).json({ error: 'Nenhum paciente crítico encontrado para este hospital.' });
    }
    
    return res.status(200).json(pacientes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar pacientes críticos.' });
  }
}

async function getPacientesByHospital(req, res) {
  const { id } = req.params;

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

    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Paciente não encontrado.' });
    }

    return res.status(500).json({ error: 'Erro ao atualizar paciente.' });
  }
}

async function getQuartosByHospital(req, res) {
  const { hospitalId } = req.params;

  try {
    const quartos = await prisma.paciente.findMany({
      where: { 
        hospitalId: Number(hospitalId),
        quarto: { not: null }
      },
      select: { 
        quarto: true
      },
      distinct: ['quarto'],
      orderBy: {
        quarto: 'asc'
      }
    });

    console.log('Quartos brutos do banco:', quartos); // LOG para debug

    // Extrair apenas os valores dos quartos e filtrar adequadamente
    const listaQuartos = quartos
      .map(item => item.quarto)
      .filter(quarto => {
        // Verifica se quarto existe e é uma string não vazia
        if (quarto === null || quarto === undefined) return false;
        
        // Se for número, converte para string
        if (typeof quarto === 'number') {
          return true; // Mantém números
        }
        
        // Se for string, verifica se não está vazia
        if (typeof quarto === 'string') {
          return quarto.trim() !== '';
        }
        
        // Descarta outros tipos (boolean, object, etc.)
        return false;
      })
      .map(quarto => {
        // Converte números para string para consistência
        if (typeof quarto === 'number') {
          return quarto.toString();
        }
        return quarto;
      });

    console.log('Quartos processados:', listaQuartos); // LOG para debug

    return res.status(200).json(listaQuartos);
  } catch (error) {
    console.error('Erro ao buscar quartos:', error);
    return res.status(500).json({ 
      error: 'Erro ao buscar quartos do hospital.',
      details: error.message 
    });
  }
}

async function altaPaciente(req, res) {
  const { id } = req.params;

  try {
    // Verifica se o paciente existe
    const paciente = await prisma.paciente.findUnique({
      where: { id: Number(id) }
    });

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente não encontrado.' });
    }

    // Deleta o paciente
    await prisma.paciente.delete({
      where: { id: Number(id) }
    });

    return res.status(200).json({ message: 'Paciente deu alta e foi removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao dar alta no paciente:', error);
    return res.status(500).json({ error: 'Erro ao dar alta no paciente.' });
  }
}


module.exports = {
  registerPaciente,
  getPacientes,
  getPacientesByHospital,
  editPaciente,
  getQuartosByHospital,
  getPacientesCriticosByHospital,
  altaPaciente // <-- adicionada aqui
};
