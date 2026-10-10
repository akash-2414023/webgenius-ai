import mongoose from 'mongoose';
import { config, isMongoConfigured } from '../config/env.js';

let isConnected = false;
let isConnecting = false;

export async function connectToDatabase(overrideUri?: string): Promise<boolean> {
  const uri = overrideUri || config.mongodbUri;

  if (!uri || uri.trim().length === 0) {
    console.warn('⚠️ MONGODB_URI is not set. MongoDB persistence is in offline mode.');
    isConnected = false;
    return false;
  }

  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  if (isConnecting) {
    return false;
  }

  isConnecting = true;

  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    mongoose.connection.on('connected', () => {
      isConnected = true;
      console.log('✅ Connected to MongoDB Atlas successfully.');
    });

    mongoose.connection.on('error', (err) => {
      isConnected = false;
      console.error('❌ MongoDB Connection Error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('⚠️ Disconnected from MongoDB.');
    });

    await mongoose.connect(uri, {
      dbName: config.mongodbDbName || 'webgenius_ai',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });

    isConnected = mongoose.connection.readyState === 1;
    isConnecting = false;
    return isConnected;
  } catch (error: any) {
    isConnecting = false;
    isConnected = false;
    console.error('❌ Failed to connect to MongoDB Atlas:', error.message);
    return false;
  }
}

export function isDatabaseConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export function getDatabaseStatus(): {
  isConfigured: boolean;
  isConnected: boolean;
  dbName: string;
} {
  return {
    isConfigured: isMongoConfigured(),
    isConnected: isDatabaseConnected(),
    dbName: config.mongodbDbName,
  };
}
