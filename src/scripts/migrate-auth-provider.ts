import { config } from 'dotenv';
import mongoose from 'mongoose';
import { mongoConfig } from '../config/mongo.config';

config();

async function migrateAuthProvider(): Promise<void> {
  try {
    await mongoose.connect(mongoConfig.uri);

    const usersCollection = mongoose.connection.collection('users');

    const result = await usersCollection.updateMany(
      {
        $or: [{ authProvider: { $exists: false } }, { authProvider: null }],
      },
      {
        $set: { authProvider: 'google' },
      },
    );

    console.log('Migration tamamlandi.');
    console.log(`Eslesen kayit: ${result.matchedCount}`);
    console.log(`Guncellenen kayit: ${result.modifiedCount}`);
  } catch (error) {
    console.error('Migration sirasinda hata olustu:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

void migrateAuthProvider();

