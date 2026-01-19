import { body } from 'express-validator';

export const createThreadValidator = [
  body('subject')
    .optional()
    .isLength({ max: 200 })
    .withMessage('El asunto no puede superar 200 caracteres'),
  body('recipientType')
    .optional()
    .isIn(['account', 'professional'])
    .withMessage('El tipo de destinatario es invalido'),
  body('recipientId')
    .optional()
    .isLength({ min: 2, max: 80 })
    .withMessage('El destinatario es invalido'),
  body('message')
    .exists({ checkFalsy: true })
    .withMessage('El mensaje es obligatorio')
    .isLength({ max: 4000 })
    .withMessage('El mensaje no puede superar 4000 caracteres')
];

export const replyThreadValidator = [
  body('message')
    .exists({ checkFalsy: true })
    .withMessage('El mensaje es obligatorio')
    .isLength({ max: 4000 })
    .withMessage('El mensaje no puede superar 4000 caracteres')
];
