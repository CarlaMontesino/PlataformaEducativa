const express = require('express');
const { Module, Course } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Editar módulo existente (solo docentes dueños)
router.put('/:id', authenticateToken, authorizeRoles('DOCENTE'), async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id, { include: Course });
    if (!module) {
      return res.status(404).json({ message: 'Módulo no encontrado' });
    }
    if (module.Course.docenteId !== req.user.id) {
      return res.status(403).json({ message: 'No puedes editar módulos de otros docentes' });
    }
    const { titulo, descripcion, duracionEstimada, videoUrl, orden } = req.body;
    await module.update({
      titulo: titulo ?? module.titulo,
      descripcion: descripcion ?? module.descripcion,
      duracionEstimada: duracionEstimada === '' ? null : duracionEstimada ?? module.duracionEstimada,
      videoUrl: videoUrl === '' ? null : videoUrl ?? module.videoUrl,
      orden: orden ? parseInt(orden, 10) : module.orden,
    });
    res.json(module);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar módulo' });
  }
});

// Eliminar módulo existente (solo docentes dueños)
router.delete('/:id', authenticateToken, authorizeRoles('DOCENTE'), async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id, { include: Course });
    if (!module) {
      return res.status(404).json({ message: 'Módulo no encontrado' });
    }
    if (module.Course.docenteId !== req.user.id) {
      return res.status(403).json({ message: 'No puedes eliminar módulos de otros docentes' });
    }
    await module.destroy();
    res.json({ message: 'Módulo eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar módulo' });
  }
});

module.exports = router;