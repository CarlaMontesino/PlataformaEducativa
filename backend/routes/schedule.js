const express = require('express');
const { ScheduleEvent, Course } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Obtener todos los eventos de agenda
router.get('/', authenticateToken, async (req, res) => {
  try {
    const events = await ScheduleEvent.findAll({
      include: [{ model: Course, attributes: ['id', 'titulo', 'docenteId'] }],
      order: [['fechaHoraInicio', 'ASC']],
    });
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener agenda' });
  }
});

// Crear evento (docente)
router.post('/', authenticateToken, authorizeRoles('DOCENTE'), async (req, res) => {
  try {
    const { courseId, titulo, descripcion, fechaHoraInicio, fechaHoraFin } = req.body;
    const event = await ScheduleEvent.create({ courseId, titulo, descripcion, fechaHoraInicio, fechaHoraFin });
    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear evento' });
  }
});

// Editar evento
router.put('/:id', authenticateToken, authorizeRoles('DOCENTE'), async (req, res) => {
  try {
    const event = await ScheduleEvent.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }
    const { courseId, titulo, descripcion, fechaHoraInicio, fechaHoraFin } = req.body;
    await event.update({ courseId, titulo, descripcion, fechaHoraInicio, fechaHoraFin });
    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar evento' });
  }
});

// Eliminar evento
router.delete('/:id', authenticateToken, authorizeRoles('DOCENTE'), async (req, res) => {
  try {
    const event = await ScheduleEvent.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }
    await event.destroy();
    res.json({ message: 'Evento eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar evento' });
  }
});

module.exports = router;