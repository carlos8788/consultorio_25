import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🔍 Verificando configuración del proyecto...\n');

const requiredEnvVars = [
  'PORT',
  'MONGODB_URI',
  'SESSION_SECRET',
  'ADMIN_USER',
  'ADMIN_PASSWORD',
  'MELI_USER',
  'MELI_PASSWORD'
];

let allEnvVarsPresent = true;

console.log('📋 Variables de entorno:');
requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    const value = ['PASSWORD', 'SECRET'].some(word => varName.includes(word))
      ? '****** (oculto)'
      : process.env[varName];
    console.log('  ✅ ' + varName + ': ' + value);
  } else {
    console.log('  ❌ ' + varName + ': NO CONFIGURADA');
    allEnvVarsPresent = false;
  }
});

console.log('\n👥 Usuarios configurados:');
console.log('  • ' + (process.env.ADMIN_USER || 'NO CONFIGURADO') + ' (Administrador)');
console.log('  • ' + (process.env.MELI_USER || 'NO CONFIGURADO') + ' (Usuario regular)');

console.log('\n🌐 Servidor:');
console.log('  Puerto: ' + (process.env.PORT || '3000'));
console.log('  URL: http://localhost:' + (process.env.PORT || '3000'));

console.log('\n📊 Base de datos:');
console.log('  MongoDB URI: ' + (process.env.MONGODB_URI || 'NO CONFIGURADA'));

if (allEnvVarsPresent) {
  console.log('\n✅ Configuración completa! El proyecto está listo para usarse.\n');
  console.log('Para iniciar el servidor ejecuta:');
  console.log('  pnpm run dev\n');
} else {
  console.log('\n⚠️  Faltan variables de entorno. Revisa el archivo .env\n');
  process.exit(1);
}
