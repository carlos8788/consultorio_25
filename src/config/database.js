import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/consultorio';

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    
    console.log('✅ Conexión a MongoDB establecida correctamente');
    console.log(`📊 Base de datos: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

// Eventos de conexión
mongoose.connection.on('connected', () => {
  console.log('🔌 Mongoose conectado a MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Error de conexión de Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose desconectado de MongoDB');
});

// Manejo de cierre de aplicación
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🛑 Conexión de Mongoose cerrada debido a la terminación de la aplicación');
  process.exit(0);
});

export default connectDB;
