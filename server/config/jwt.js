require('dotenv').config();

const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your_jwt_secret_key_change_production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
};

module.exports = jwtConfig;
