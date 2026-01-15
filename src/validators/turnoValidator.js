import { body } from 'express-validator';

export const createTurnoValidator = [
  body('fecha')
    .trim()
    .notEmpty().withMessage('La fecha es obligatoria'),

  body('hora')
    .trim()
    .notEmpty().withMessage('La hora es obligatoria'),

  body('paciente')
    .optional({ checkFalsy: true, nullable: true })
    .isMongoId().withMessage('ID de paciente invalido'),

  body('observacionesTurno')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Las observaciones no pueden tener mas de 500 caracteres'),

  body('diagnostico')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('El diagnostico no puede tener mas de 500 caracteres'),

  body('estado')
    .optional()
    .isIn(['pendiente', 'confirmado', 'cancelado', 'completado']).withMessage('Estado invalido')
];

export const updateTurnoValidator = [
  body('fecha')
    .optional()
    .trim(),

  body('hora')
    .optional()
    .trim(),

  body('paciente')
    .optional({ checkFalsy: true, nullable: true })
    .isMongoId().withMessage('ID de paciente invalido'),

  body('observacionesTurno')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Las observaciones no pueden tener mas de 500 caracteres'),

  body('diagnostico')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('El diagnostico no puede tener mas de 500 caracteres'),

  body('estado')
    .optional()
    .isIn(['pendiente', 'confirmado', 'cancelado', 'completado']).withMessage('Estado invalido')
];

export const createManyTurnosValidator = [
  body('professionalId')
    .optional()
    .isMongoId().withMessage('ID de profesional invalido'),
  body('turnos')
    .isArray({ min: 1 }).withMessage('Debes enviar al menos un turno'),
  body('turnos.*.fecha')
    .trim()
    .notEmpty().withMessage('La fecha es obligatoria'),
  body('turnos.*.hora')
    .trim()
    .notEmpty().withMessage('La hora es obligatoria')
];
