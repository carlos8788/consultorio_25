import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { logger } from '../logger/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.resolve(__dirname, '../../public');

export const buildImagePath = (relativePath) =>
  path.join(PUBLIC_DIR, relativePath);

export const saveBase64Image = async ({ base64Data, outputPath }) => {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const absolutePath = buildImagePath(outputPath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, buffer);
    return outputPath;
  } catch (error) {
    logger.error('Error al guardar imagen', error);
    throw error;
  }
};

export const deleteImage = async (relativePath) => {
  try {
    if (!relativePath) return;
    const absolutePath = buildImagePath(relativePath);
    await fs.unlink(absolutePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.warn('No se pudo eliminar la imagen', relativePath, error);
    }
  }
};
