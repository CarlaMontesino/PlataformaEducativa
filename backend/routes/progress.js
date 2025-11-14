const express = require('express');
const { Module, ModuleProgress, Course } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Marcar módulo como completado por un estudiante
router.post('/modules/:id/complete', authenticateToken, authorizeRoles('ESTUDIANTE'), async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id);
    if (!module) {
      return res.status(404).json({ message: 'Módulo no encontrado' });
    }
    const [progress] = await ModuleProgress.findOrCreate({
      where: { userId: req.user.id, moduleId: module.id },
      defaults: { estado: 'Pendiente' },
    });
    await progress.update({ estado: 'Completado', fechaCompletado: new Date() });
    res.json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar progreso' });
  }
});

// Obtener resumen de progreso del usuario
router.get('/my-progress', authenticateToken, async (req, res) => {
  try {
    if (req.user.rol !== 'ESTUDIANTE') {
      return res.json({ cursos: [], resumen: { totalCursos: 0, totalModulos: 0, completados: 0, porcentajeGeneral: 0 } });
    }

    const courses = await req.user.getInscripciones({ include: [{ model: Module, as: 'modulos' }] });
    const progressRecords = await ModuleProgress.findAll({ where: { userId: req.user.id } });

    const cursos = courses.map((course) => {
      const totalModulos = course.modulos.length;
      const completados = course.modulos.filter((mod) =>
        progressRecords.some((record) => record.moduleId === mod.id && record.estado === 'Completado')
      ).length;
      return {
        cursoId: course.id,
        cursoTitulo: course.titulo,
        totalModulos,
        completados,
        porcentaje: totalModulos === 0 ? 0 : Math.round((completados / totalModulos) * 100),
      };
    });

    const totalModulos = cursos.reduce((acc, curso) => acc + curso.totalModulos, 0);
    const completados = cursos.reduce((acc, curso) => acc + curso.completados, 0);
    const porcentajeGeneral = totalModulos === 0 ? 0 : Math.round((completados / totalModulos) * 100);

    res.json({
      cursos,
      resumen: {
        totalCursos: cursos.length,
        totalModulos,
        completados,
        porcentajeGeneral,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener progreso' });
  }
});

module.exports = router;