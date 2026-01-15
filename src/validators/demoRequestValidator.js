import { body } from 'express-validator';

export const createDemoRequestValidator = [
  body('nombre')
    .exists({ checkFalsy: true }).withMessage('El nombre es obligatorio')
    .trim()
    .isLength({ max: 120 }).withMessage('El nombre no puede superar 120 caracteres'),
  body('email')
    .exists({ checkFalsy: true }).withMessage('El email es obligatorio')
    .isEmail().withMessage('El email no es valido')
    .normalizeEmail()
    .isLength({ max: 160 }).withMessage('El email no puede superar 160 caracteres'),
  body('telefono')
    .exists({ checkFalsy: true }).withMessage('El telefono es obligatorio')
    .trim()
    .isLength({ min: 6, max: 40 }).withMessage('El telefono debe tener entre 6 y 40 caracteres'),
  body('centro')
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage('El centro no puede superar 120 caracteres'),
  body('mensaje')
    .optional()
    .trim()
    .isLength({ max: 800 }).withMessage('El mensaje no puede superar 800 caracteres'),
  body('intent')
    .optional()
    .isIn(['demo', 'trial']).withMessage('Intent invalido'),
  body('source')
    .optional()
    .trim()
    .isLength({ max: 40 }).withMessage('El origen no puede superar 40 caracteres')
];
