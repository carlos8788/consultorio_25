import { body, query } from 'express-validator';

const tiposPermitidos = ['clinica', 'administrativa', 'seguimiento', 'general', 'otro'];

export const createNotaPacienteValidator = [
  body('titulo')
    .trim()
    .notEmpty().withMessage('El titulo es obligatorio')
    .isLength({ max: 160 }).withMessage('El titulo no puede tener mas de 160 caracteres'),

  body('contenido')
    .trim()
    .notEmpty().withMessage('El contenido es obligatorio')
    .isLength({ max: 4000 }).withMessage('El contenido no puede tener mas de 4000 caracteres'),

  body('tipo')
    .optional()
    .isIn(tiposPermitidos).withMessage('Tipo de nota invalido'),

  body('tags')
    .optional()
    .isArray({ max: 15 }).withMessage('Las tags deben ser un arreglo'),

  body('tags.*')
    .optional()
    .isString().withMessage('Cada tag debe ser texto')
    .trim()
    .isLength({ max: 30 }).withMessage('Cada tag debe tener como maximo 30 caracteres'),

  body('pinned')
    .optional()
    .isBoolean().withMessage('pinned debe ser booleano'),

  body('sharedWith')
    .optional()
    .isArray().withMessage('sharedWith debe ser un arreglo'),

  body('sharedWith.*')
    .optional()
    .isMongoId().withMessage('sharedWith debe contener IDs de profesionales validos'),

  body('pacienteId')
    .optional()
    .isMongoId().withMessage('pacienteId invalido')
];

export const updateNotaPacienteValidator = [
  body('titulo')
    .optional()
    .trim()
    .isLength({ min: 1, max: 160 }).withMessage('El titulo debe tener entre 1 y 160 caracteres'),

  body('contenido')
    .optional()
    .trim()
    .isLength({ min: 1, max: 4000 }).withMessage('El contenido debe tener entre 1 y 4000 caracteres'),

  body('tipo')
    .optional()
    .isIn(tiposPermitidos).withMessage('Tipo de nota invalido'),

  body('tags')
    .optional()
    .isArray({ max: 15 }).withMessage('Las tags deben ser un arreglo'),

  body('tags.*')
    .optional()
    .isString().withMessage('Cada tag debe ser texto')
    .trim()
    .isLength({ max: 30 }).withMessage('Cada tag debe tener como maximo 30 caracteres'),

  body('pinned')
    .optional()
    .isBoolean().withMessage('pinned debe ser booleano'),

  body('sharedWith')
    .optional()
    .isArray().withMessage('sharedWith debe ser un arreglo'),

  body('sharedWith.*')
    .optional()
    .isMongoId().withMessage('sharedWith debe contener IDs de profesionales validos'),

  body('pacienteId')
    .optional()
    .isMongoId().withMessage('pacienteId invalido')
];

export const listNotasPacienteValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page debe ser un entero positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit debe estar entre 1 y 100'),
  query('pinned')
    .optional()
    .isBoolean().withMessage('pinned debe ser booleano'),
  query('tipo')
    .optional()
    .isIn(tiposPermitidos).withMessage('Tipo de nota invalido'),
  query('pacienteId')
    .optional()
    .isMongoId().withMessage('pacienteId invalido')
];
