import dns from 'node:dns';
import mongoose from 'mongoose';
import { ENV } from './env.js';
import { ensureDefaultAdmin } from '../utils/bootstrapAdmin.js';

// Resolve SRV DNS issues in Node.js on Windows / local ISP DNS
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignore in environments where setting DNS servers is restricted
}

export const connectDB = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`📦 MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Mandatory default admin & store configuration bootstrap
    await ensureDefaultAdmin();
  } catch (error: any) {
    console.warn(`⚠️  MongoDB Connection Warning: ${error.message || error}`);
    console.warn('   Please check your MONGODB_URI in .env:');
    console.warn('   • If using MongoDB Atlas: Set MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/nova_fashion');
    console.warn('   • If using Local MongoDB: Ensure MongoDB Service is running on port 27017');
    if (ENV.IS_PRODUCTION) {
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB event error:', err);
});
