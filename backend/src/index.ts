import { createApp } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';

const startServer = async () => {
  try {
    await connectDatabase();

    const app = createApp();

    app.listen(env.PORT, () => {
      console.log(`====================================================`);
      console.log(`  🛡️  BrandGuard AI Backend Service Running`);
      console.log(`  🚀 Port: ${env.PORT}`);
      console.log(`  🌐 Environment: ${env.NODE_ENV}`);
      console.log(`  🤖 Gemini Model: ${env.GEMINI_MODEL}`);
      console.log(`  📊 Client Origin: ${env.CLIENT_URL}`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
