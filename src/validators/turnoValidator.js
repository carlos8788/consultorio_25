import { body } from 'express-validator';

export const createTurnoValidator = [
  body('fecha')
    .trim()
    .notEmpty().withMessage('La fecha es obligatoria'),
  
  body('hora')
    .trim()
    .notEmpty().withMessage('La hora es obligatoria'),
  
  body('paciente')
    .optional()
    .isMongoId().withMessage('ID de paciente inválido'),
  
  body('diagnostico')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('El diagnóstico no puede tener más de 500 caracteres'),
  
  body('estado')
    .optional()
    .isIn(['pendiente', 'confirmado', 'cancelado', 'completado']).withMessage('Estado inválido')
];

export const updateTurnoValidator = createTurnoValidator;
