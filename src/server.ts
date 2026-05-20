import 'dotenv/config';
import { createApp } from './app';

const PORT = process.env.PORT || 3000;

async function main(): Promise<void> {
  const app = createApp();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n`);
    console.log(`  ServeAi Backend`);
    console.log(`  ${'='.repeat(30)}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Port:        ${PORT}`);
    console.log(`  API Base:    http://localhost:${PORT}/api`);
    console.log(`  Health:      http://localhost:${PORT}/health`);
    console.log(`\n`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
