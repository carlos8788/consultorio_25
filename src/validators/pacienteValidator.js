import { body } from 'express-validator';

const validateObservaciones = (value) => {
  if (value === undefined || value === null) return true;

  if (typeof value === 'string') {
    return value.trim().length <= 500;
  }

  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((entry) => {
    if (!entry || typeof entry !== 'object') return false;
    const professional = entry.professional;
    const observacion = entry.observacion ?? entry.texto ?? '';
    if (typeof professional !== 'string' || !professional.match(/^[0-9a-fA-F]{24}$/)) {
      return false;
    }
    if (typeof observacion !== 'string') return false;
    return observacion.trim().length <= 500;
  });
};

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
    .isLength({ min: 7, max: 8 }).withMessage('El DNI debe tener entre 7 y 8 digitos'),

  body('telefono')
    .trim()
    .notEmpty().withMessage('El telefono es obligatorio')
    .isLength({ max: 20 }).withMessage('El telefono no puede tener mas de 20 caracteres'),

  body('obraSocial')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId().withMessage('ID de obra social invalido'),

  body('observaciones')
    .optional()
    .custom(validateObservaciones).withMessage('Las observaciones no son validas'),

  body('edad')
    .optional()
    .trim(),

  body('fechaNacimiento')
    .optional()
    .trim()
    .isISO8601().withMessage('Fecha de nacimiento invalida')
];

export const updatePacienteValidator = [
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres'),

  body('apellido')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('El apellido debe tener entre 2 y 50 caracteres'),

  body('dni')
    .optional()
    .trim()
    .isLength({ min: 7, max: 8 }).withMessage('El DNI debe tener entre 7 y 8 digitos'),

  body('telefono')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('El telefono no puede tener mas de 20 caracteres'),

  body('obraSocial')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId().withMessage('ID de obra social invalido'),

  body('observaciones')
    .optional()
    .custom(validateObservaciones).withMessage('Las observaciones no son validas'),

  body('edad')
    .optional()
    .trim(),

  body('fechaNacimiento')
    .optional()
    .trim()
    .isISO8601().withMessage('Fecha de nacimiento invalida'),

  body('professionals')
    .optional()
    .isArray().withMessage('professionals debe ser un arreglo')
];
