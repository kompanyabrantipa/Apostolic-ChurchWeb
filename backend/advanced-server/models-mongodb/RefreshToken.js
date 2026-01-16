const mongoose = require('mongoose');
const crypto = require('crypto');

// Hash the refresh token for secure storage
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Refresh token schema for secure refresh token management
const refreshTokenSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true,
    index: true // For fast lookup by user ID
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true // For cleanup jobs
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  userAgent: {
    type: String,
    default: ''
  },
  ip: {
    type: String,
    default: ''
  },
  revoked: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: false
});

// Indexes for performance - removed duplicates
// Note: Single-field indexes are now defined at the field level for clarity
// Only keeping the compound index which doesn't duplicate field-level indexes
refreshTokenSchema.index({ userId: 1, revoked: 1, expiresAt: 1 }); // Compound index for efficient user token lookups

// Static methods
refreshTokenSchema.statics.createToken = async function(refreshTokenData) {
  const refreshToken = new this({
    _id: refreshTokenData.id,
    userId: refreshTokenData.userId,
    tokenHash: hashToken(refreshTokenData.token), // Store hashed version
    expiresAt: refreshTokenData.expiresAt,
    userAgent: refreshTokenData.userAgent || '',
    ip: refreshTokenData.ip || ''
  });

  return await refreshToken.save();
};

refreshTokenSchema.statics.findByToken = async function(token) {
  const tokenHash = hashToken(token); // Hash the incoming token before lookup
  return await this.findOne({ 
    tokenHash: tokenHash, 
    revoked: false, 
    expiresAt: { $gt: new Date() } 
  });
};

refreshTokenSchema.statics.findByUserId = async function(userId) {
  return await this.find({ 
    userId: userId, 
    revoked: false, 
    expiresAt: { $gt: new Date() } 
  });
};

refreshTokenSchema.statics.revokeToken = async function(token) {
  const tokenHash = hashToken(token); // Hash the incoming token before lookup
  return await this.updateOne(
    { tokenHash: tokenHash },
    { revoked: true }
  );
};

refreshTokenSchema.statics.revokeAllUserTokens = async function(userId) {
  return await this.updateMany(
    { userId: userId },
    { revoked: true }
  );
};

refreshTokenSchema.statics.cleanExpiredTokens = async function() {
  const result = await this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { revoked: true }
    ]
  });
  return result.deletedCount;
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);