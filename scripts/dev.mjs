import { spawn } from 'node:child_process';

const children = [
  spawn('node', ['backend/server.mjs'], { stdio: 'inherit', shell: true }),
  spawn('npm.cmd', ['run', 'dev:frontend'], { stdio: 'inherit', shell: true }),
];

const stopAll = () => {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
};

process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);

for (const child of children) {
  child.on('exit', (code) => {
    if (code && code !== 0) {
      stopAll();
      process.exit(code);
    }
  });
}
