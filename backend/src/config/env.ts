import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/brandguard',
  JWT_SECRET: process.env.JWT_SECRET || 'brandguard_super_secure_jwt_dev_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  GEMINI_EMBEDDING_MODEL: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
  USE_ATLAS_VECTOR_SEARCH: process.env.USE_ATLAS_VECTOR_SEARCH === 'true',
  ATLAS_VECTOR_INDEX_NAME: process.env.ATLAS_VECTOR_INDEX_NAME || 'brand_embeddings_index',
};
