import { body } from 'express-validator';

export const createPacienteValidator = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  
  body('apellido')
    .trim()
    .notEmpty().withMessage('El apellido es obligatorio')
    .isLength({ min: 2, max: 50 }).withMessage('El apellido debe tener entre 2 y 50 caracteres'),
  
  body('dni')
    .trim()
    .notEmpty().withMessage('El DNI es obligatorio')
    .isLength({ min: 7, max: 8 }).withMessage('El DNI debe tener entre 7 y 8 dígitos'),
  
  body('telefono')
    .trim()
    .notEmpty().withMessage('El teléfono es obligatorio')
    .isLength({ max: 20 }).withMessage('El teléfono no puede tener más de 20 caracteres'),
  
  body('obraSocial')
    .optional()
    .isMongoId().withMessage('ID de obra social inválido'),
  
  body('observaciones')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Las observaciones no pueden tener más de 500 caracteres'),
  
  body('edad')
    .optional()
    .trim(),
  
  body('fechaNacimiento')
    .optional()
    .trim()
];

export const updatePacienteValidator = createPacienteValidator;
