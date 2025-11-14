const express = require('express');
const { Course, User, Enrollment, Module } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Obtener cursos en los que participa el usuario
router.get('/my-courses', authenticateToken, async (req, res) => {
  try {
    if (req.user.rol === 'DOCENTE') {
      const cursos = await Course.findAll({
        where: { docenteId: req.user.id },
        include: [{ model: Module, as: 'modulos' }],
        order: [['createdAt', 'DESC']],
      });
      return res.json(cursos);
    }
    const cursos = await Course.findAll({
      include: [
        { model: User, as: 'docente', attributes: ['id', 'nombre'] },
        {
          model: User,
          as: 'estudiantes',
          where: { id: req.user.id },
          attributes: ['id'],
        },
        { model: Module, as: 'modulos' },
      ],
    });
    res.json(cursos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener cursos del usuario' });
  }
});

module.exports = router;