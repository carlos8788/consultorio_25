import { body } from 'express-validator';

export const createInteresadoValidator = [
  body('professional')
    .optional()
    .isMongoId().withMessage('ID del profesional inválido'),
  body('paciente')
    .optional()
    .isMongoId().withMessage('ID de paciente inválido'),
  body('nombre')
    .optional()
    .trim()
    .isLength({ max: 80 }).withMessage('El nombre no puede superar 80 caracteres'),
  body('apellido')
    .optional()
    .trim()
    .isLength({ max: 80 }).withMessage('El apellido no puede superar 80 caracteres'),
  body('telefono')
    .optional()
    .trim()
    .isLength({ max: 30 }).withMessage('El teléfono no puede superar 30 caracteres'),
  body('comentario')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('El comentario no puede superar 300 caracteres')
];
