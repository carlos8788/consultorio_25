import { Schema, model } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const obraSocialSchema = new Schema({
  telefono: {
    type: String,
    trim: true
  },
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    unique: true,
    trim: true
  },
  direccion: {
    type: String,
    trim: true
  },
  padron: {
    type: String,
    default: 'Padrón A',
    enum: ['Padrón A', 'Padrón B', 'Padrón C']
  }
}, {
  timestamps: true,
  versionKey: false
});

// Plugin de paginación
obraSocialSchema.plugin(mongoosePaginate);

// Índices
// obraSocialSchema.index({ nombre: 1 });

const ObraSocial = model('ObraSocial', obraSocialSchema);

export default ObraSocial;
