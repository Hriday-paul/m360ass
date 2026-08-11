import { Server } from 'http';
import app from '.';
import config from './config';

let server: Server;

const port = config.port || 3000;

async function main() {
  try {
    
    server = app.listen(port, () => {
      console.log(`[server]: Server is running at ${config.ip + ":" + port}`);
    });
  } catch (err) {
    console.error(err);
  }
}
main();

process.on('unhandledRejection', err => {
  console.log(`😈 unahandledRejection is detected , shutting down ...`, err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on('uncaughtException', () => {
  console.log(`😈 uncaughtException is detected , shutting down ...`);
  process.exit(1);
});
