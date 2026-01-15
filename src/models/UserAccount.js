import { Schema, model } from 'mongoose';
import { ROLES } from '../constants/roles.js';

const userAccountSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    required: true
  },
  professional: {
    type: Schema.Types.ObjectId,
    ref: 'Professional',
    default: null
  },
  profile: {
    nombre: { type: String, trim: true },
    apellido: { type: String, trim: true }
  },
  active: {
    type: Boolean,
    default: true
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: String,
    trim: true,
    default: null
  }
}, {
  timestamps: true,
  versionKey: false
});

userAccountSchema.index({ role: 1 });
userAccountSchema.index({ professional: 1 });
userAccountSchema.index({ deletedAt: 1 });

const UserAccount = model('UserAccount', userAccountSchema);

export default UserAccount;
