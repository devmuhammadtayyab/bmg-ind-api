import bcrypt from 'bcrypt';
import { Schema, model } from 'mongoose';

const { SALT_ROUNDS } = process.env;

const schema = new Schema({
  _id: { type: Schema.Types.ObjectId },
  name: { type: String },
  email: {
    type: String,
    unique: true,
    required: 'Email Address is required'
  },
  password: { type: String },
  storeIds: [{
    type: Schema.Types.ObjectId,
    ref: 'stores'
  }]
}, {
  strict: false,
  timestamps: true
});

schema.pre('updateOne', async function SavePassword(next) {
  try {
    const user = this;
    const { $set } = user.getUpdate();

    const hashSalt = parseInt(SALT_ROUNDS, 10) || 10;
    const hashedPassword = await bcrypt.hash($set.password, hashSalt);
    $set.password = hashedPassword;

    return next();
  } catch (error) {
    const err = new Error();
    err.errorMessage = 'Error while encrypting';
    throw err;
  }
});

schema.methods.ValidatePassword = function ValidatePassword(candidatePassword) {
  try {
    return bcrypt.compareSync(candidatePassword, this.password);
  } catch (error) {
    const err = new Error();
    err.errorMessage = 'Error In Password Validation';

    throw err;
  }
};

const User = model('users', schema, 'users');

export default User;
