import { body } from 'express-validator';

export const createIdeaRequestValidator = [
  body('nombre')
    .exists({ checkFalsy: true }).withMessage('El nombre es obligatorio')
    .trim()
    .isLength({ max: 120 }).withMessage('El nombre no puede superar 120 caracteres'),
  body('email')
    .exists({ checkFalsy: true }).withMessage('El email es obligatorio')
    .isEmail().withMessage('El email no es valido')
    .normalizeEmail()
    .isLength({ max: 160 }).withMessage('El email no puede superar 160 caracteres'),
  body('rol')
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage('El rol no puede superar 120 caracteres'),
  body('mensaje')
    .exists({ checkFalsy: true }).withMessage('El mensaje es obligatorio')
    .trim()
    .isLength({ max: 2000 }).withMessage('El mensaje no puede superar 2000 caracteres'),
  body('impacto')
    .optional()
    .trim()
    .isLength({ max: 800 }).withMessage('El impacto no puede superar 800 caracteres'),
  body('source')
    .optional()
    .trim()
    .isLength({ max: 40 }).withMessage('El origen no puede superar 40 caracteres'),
  body('website')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('El campo website es invalido')
];
