const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 🩺 Criar paciente
 * Apenas MÉDICO
 */
async function registerPaciente(req, res) {
  const { nome, idade, sexo, nivelalerta, relatorio, prescricao, estadia, quarto } = req.body;

  try {

    if (req.user.tipo_user !== 3) {
      return res.status(403).json({
        error: 'Apenas médicos podem cadastrar pacientes.'
      });
    }

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
        hospitalId: req.user.hospitalId // 🔥 FORÇADO
      }
    });

    return res.status(201).json({
      message: 'Paciente cadastrado com sucesso!'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Erro ao cadastrar paciente.'
    });
  }
}


/**
 * 👀 Visualizar pacientes
 * Todos autenticados podem visualizar
 */
async function getPacientes(req, res) {
  try {

    const pacientes = await prisma.paciente.findMany({
      where: {
        hospitalId: req.user.hospitalId // 🔥 FILTRO OBRIGATÓRIO
      }
    });

    return res.status(200).json(pacientes);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Erro ao buscar pacientes.'
    });
  }
}


/**
 * 🚨 Pacientes críticos
 * Todos autenticados podem visualizar
 */
async function getPacientesCriticos(req, res) {
  try {

    const pacientes = await prisma.paciente.findMany({
      where: {
        hospitalId: req.user.hospitalId,
        nivelalerta: {
          in: ['Vermelho', 'Laranja']
        }
      },
      orderBy: {
        nivelalerta: 'desc'
      }
    });

    return res.status(200).json(pacientes);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Erro ao buscar pacientes críticos.'
    });
  }
}


/**
 * ✏ Editar paciente
 * Apenas médico
 */
async function editPaciente(req, res) {
  const { id, nome, idade, sexo, nivelalerta, relatorio, prescricao, estadia, quarto } = req.body;

  try {

    if (req.user.tipo_user !== 3) {
      return res.status(403).json({
        error: 'Apenas médicos podem editar pacientes.'
      });
    }

    const paciente = await prisma.paciente.findUnique({
      where: { id: Number(id) }
    });

    if (!paciente || paciente.hospitalId !== req.user.hospitalId) {
      return res.status(403).json({
        error: 'Você não pode editar pacientes de outro hospital.'
      });
    }

    const atualizado = await prisma.paciente.update({
      where: { id: Number(id) },
      data: {
        nome,
        idade,
        sexo,
        nivelalerta,
        relatorio,
        prescricao,
        estadia,
        quarto
      }
    });

    return res.status(200).json({
      message: 'Paciente atualizado com sucesso.',
      paciente: atualizado
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Erro ao atualizar paciente.'
    });
  }
}


/**
 * 🗑 Dar alta
 * Apenas médico
 */
async function altaPaciente(req, res) {
  const { id } = req.params;

  try {

    if (req.user.tipo_user !== 3) {
      return res.status(403).json({
        error: 'Apenas médicos podem dar alta.'
      });
    }

    const paciente = await prisma.paciente.findUnique({
      where: { id: Number(id) }
    });

    if (!paciente || paciente.hospitalId !== req.user.hospitalId) {
      return res.status(403).json({
        error: 'Você não pode remover pacientes de outro hospital.'
      });
    }

    await prisma.paciente.delete({
      where: { id: Number(id) }
    });

    return res.status(200).json({
      message: 'Paciente removido com sucesso.'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Erro ao dar alta no paciente.'
    });
  }
}

module.exports = {
  registerPaciente,
  getPacientes,
  getPacientesCriticos,
  editPaciente,
  altaPaciente
};