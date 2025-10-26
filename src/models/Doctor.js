import { Schema, model } from 'mongoose';

const doctorSchema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nombre: {
    type: String,
    required: [true, 'El nombre del profesional es obligatorio'],
    trim: true
  },
  apellido: {
    type: String,
    required: [true, 'El apellido del profesional es obligatorio'],
    trim: true
  },
  especialidad: {
    type: String,
    trim: true,
    default: 'Clínica General'
  },
  matricula: {
    type: String,
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  versionKey: false
});

doctorSchema.index({ matricula: 1 });

const Doctor = model('Doctor', doctorSchema);

export default Doctor;
