const express = require('express');
const { Course, Module, User, Enrollment } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Obtener todos los cursos disponibles con datos básicos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const courses = await Course.findAll({
      include: [{ model: User, as: 'docente', attributes: ['id', 'nombre', 'email'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener cursos' });
  }
});

// Crear un nuevo curso (solo docentes)
router.post('/', authenticateToken, authorizeRoles('DOCENTE'), async (req, res) => {
  try {
    const { titulo, descripcion, nivel } = req.body;
    const course = await Course.create({ titulo, descripcion, nivel, docenteId: req.user.id });
    res.status(201).json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear curso' });
  }
});

// Obtener detalle de curso con módulos
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        { model: Module, as: 'modulos' },
        { model: User, as: 'docente', attributes: ['id', 'nombre'] },
      ],
      order: [[{ model: Module, as: 'modulos' }, 'orden', 'ASC']],
    });
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }
    res.json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener curso' });
  }
});

// Editar curso
router.put('/:id', authenticateToken, authorizeRoles('DOCENTE'), async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }
    if (course.docenteId !== req.user.id) {
      return res.status(403).json({ message: 'Solo el docente creador puede editar este curso' });
    }

    const { titulo, descripcion, nivel } = req.body;
    await course.update({ titulo, descripcion, nivel });
    res.json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar curso' });
  }
});

// Eliminar curso
router.delete('/:id', authenticateToken, authorizeRoles('DOCENTE'), async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }
    if (course.docenteId !== req.user.id) {
      return res.status(403).json({ message: 'Solo el docente creador puede eliminar este curso' });
    }
    await course.destroy();
    res.json({ message: 'Curso eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar curso' });
  }
});

// Crear módulo dentro de un curso
router.post('/:courseId/modules', authenticateToken, authorizeRoles('DOCENTE'), async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }
    if (course.docenteId !== req.user.id) {
      return res.status(403).json({ message: 'No puedes crear módulos en cursos de otros docentes' });
    }
    const { titulo, descripcion, duracionEstimada, videoUrl, orden } = req.body;
    const existingModules = await course.getModulos();
    const ordenAsignado = orden ? parseInt(orden, 10) : existingModules.length + 1;
    const module = await Module.create({
      titulo,
      descripcion,
      duracionEstimada: duracionEstimada || null,
      videoUrl: videoUrl || null,
      orden: ordenAsignado,
      courseId: course.id,
    });
    res.status(201).json(module);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear módulo' });
  }
});

// Inscripción a un curso
router.post('/:id/enroll', authenticateToken, authorizeRoles('ESTUDIANTE'), async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }
    const [enrollment, created] = await Enrollment.findOrCreate({
      where: { userId: req.user.id, courseId: course.id },
    });
    if (!created) {
      return res.status(400).json({ message: 'Ya estás inscripto en este curso' });
    }
    res.status(201).json(enrollment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al inscribirse al curso' });
  }
});

// Obtener cursos del usuario autenticado
router.get('/mis/cursos', authenticateToken, async (req, res) => {
  try {
    if (req.user.rol === 'DOCENTE') {
      const cursos = await Course.findAll({ where: { docenteId: req.user.id } });
      return res.json(cursos);
    }
    const cursos = await req.user.getInscripciones({ include: [{ model: User, as: 'docente' }] });
    res.json(cursos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener cursos del usuario' });
  }
});

module.exports = router;