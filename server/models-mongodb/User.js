const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema matching PostgreSQL users table structure
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [50, 'Username cannot exceed 50 characters']
  },
  password_hash: {
    type: String,
    required: [true, 'Password hash is required']
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'viewer'],
    default: 'admin'
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'users'
});

// Indexes for performance (username unique index already defined in schema)
userSchema.index({ role: 1 });

// Instance methods
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  
  // Convert MongoDB _id to id for PostgreSQL compatibility
  return {
    id: user._id.toString(),
    username: user.username,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at,
    createdAt: user.created_at, // Alias for compatibility
    updatedAt: user.updated_at   // Alias for compatibility
  };
};

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password_hash);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Static methods
userSchema.statics.createUser = async function(userData) {
  try {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const user = new this({
      username: userData.username,
      password_hash: hashedPassword,
      role: userData.role || 'admin'
    });
    
    await user.save();
    return user;
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('Username already exists');
    }
    throw error;
  }
};

userSchema.statics.findByUsername = async function(username) {
  try {
    return await this.findOne({ username: username });
  } catch (error) {
    throw new Error('Error finding user by username');
  }
};

userSchema.statics.updatePassword = async function(userId, newPassword) {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const user = await this.findByIdAndUpdate(
      userId,
      { password_hash: hashedPassword },
      { new: true }
    );
    
    return user;
  } catch (error) {
    throw new Error('Error updating password');
  }
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  // Ensure username is lowercase for consistency
  if (this.username) {
    this.username = this.username.toLowerCase().trim();
  }
  next();
});

// Pre-update middleware
userSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
  // Update the updated_at field
  this.set({ updated_at: new Date() });
  next();
});

// Virtual for password (write-only)
userSchema.virtual('password').set(async function(password) {
  this.password_hash = await bcrypt.hash(password, 12);
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    // Remove sensitive fields
    delete ret.password_hash;
    delete ret.__v;
    delete ret._id;
    return ret;
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
