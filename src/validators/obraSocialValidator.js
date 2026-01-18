import { body } from 'express-validator';

export const createObraSocialValidator = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  
  body('telefono')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('El teléfono no puede tener más de 20 caracteres'),
  
  body('direccion')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('La dirección no puede tener más de 200 caracteres'),
  
  body('padron')
    .optional()
    .isIn(['Padrón A', 'Padrón B', 'Categorizado']).withMessage('Padrón inválido'),

  body('estado')
    .optional()
    .isIn(['activa', 'suspendida']).withMessage('Estado inválido'),

  body('attachToProfessional')
    .optional()
    .isBoolean().withMessage('attachToProfessional debe ser booleano')
];

export const updateObraSocialValidator = createObraSocialValidator;

export const obraSocialEstadoValidator = [
  body('estado')
    .notEmpty().withMessage('El estado es obligatorio')
    .isIn(['activa', 'suspendida']).withMessage('Estado inválido')
];
