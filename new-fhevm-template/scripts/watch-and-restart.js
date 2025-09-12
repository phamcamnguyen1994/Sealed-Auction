const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Watch for changes in abi/SealedAuction.json
const abiFile = path.join(__dirname, '..', 'abi', 'SealedAuction.json');
const frontendFile = path.join(__dirname, '..', 'packages', 'site', 'contracts', 'SealedAuction.json');

console.log('👀 Watching for ABI changes...');
console.log('📁 Watching:', abiFile);
console.log('📁 Target:', frontendFile);

let frontendProcess = null;

function startFrontend() {
  if (frontendProcess) {
    console.log('🔄 Restarting frontend...');
    frontendProcess.kill();
  }
  
  console.log('🚀 Starting frontend...');
  frontendProcess = spawn('npm', ['run', 'dev:mock'], {
    cwd: path.join(__dirname, '..', 'packages', 'site'),
    stdio: 'inherit',
    shell: true
  });
}

function copyAndRestart() {
  try {
    if (fs.existsSync(abiFile)) {
      // Ensure frontend directory exists
      const frontendDir = path.dirname(frontendFile);
      if (!fs.existsSync(frontendDir)) {
        fs.mkdirSync(frontendDir, { recursive: true });
      }
      
      // Copy file
      fs.copyFileSync(abiFile, frontendFile);
      console.log('✅ ABI copied to frontend');
      
      // Restart frontend
      startFrontend();
    }
  } catch (error) {
    console.error('❌ Error copying ABI:', error);
  }
}

// Watch for changes
fs.watchFile(abiFile, { interval: 1000 }, (curr, prev) => {
  if (curr.mtime > prev.mtime) {
    console.log('📝 ABI file changed, copying and restarting...');
    copyAndRestart();
  }
});

// Initial copy and start
copyAndRestart();

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping watcher...');
  if (frontendProcess) {
    frontendProcess.kill();
  }
  process.exit(0);
});
