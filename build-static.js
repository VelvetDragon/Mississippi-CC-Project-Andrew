import { copyFileSync, existsSync, renameSync, mkdirSync, rmdirSync, cpSync, rmSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('📦 Building static site for Reclaim...\n');

// Backup original config
const originalConfig = 'astro.config.mjs';
const backupConfig = 'astro.config.mjs.backup';

if (existsSync(originalConfig)) {
  copyFileSync(originalConfig, backupConfig);
  console.log('✓ Backed up original config\n');
}

// Temporarily rename server-only pages with underscore prefix (Astro ignores these)
const serverOnlyPaths = [
  'src/pages/login.astro',
  'src/pages/dashboard',
  'src/pages/api',
  'src/pages/admin'
];

const renamedPaths = [];

try {
  // Rename server-only pages with underscore prefix (Astro will ignore them)
  for (const path of serverOnlyPaths) {
    if (existsSync(path)) {
      const pathParts = path.split('/');
      const basename = pathParts.pop();
      const dir = pathParts.join('/');
      const renamedPath = join(dir, `_${basename}`);
      
      try {
        // Rename with underscore prefix (Astro ignores files/folders starting with _)
        renameSync(path, renamedPath);
        renamedPaths.push({ original: path, renamed: renamedPath });
        console.log(`✓ Temporarily excluded: ${path} → ${renamedPath}\n`);
      } catch (error) {
        // If rename fails (Windows file lock)
        if (error.code === 'EPERM' || error.code === 'EBUSY') {
          console.error(`\n❌ Cannot rename ${path} - file/folder is locked!\n`);
          console.error(`   This usually happens when files are open in VS Code.\n`);
          console.error(`   SOLUTION:\n`);
          console.error(`   1. Close VS Code completely (not just the files)\n`);
          console.error(`   2. Close any other programs that might have files open\n`);
          console.error(`   3. Run this command again: npm run build:static\n`);
          console.error(`   OR manually rename in File Explorer:\n`);
          console.error(`      ${path} → ${join(dir, `_${basename}`)}\n`);
          throw new Error(`Cannot proceed: ${path} is locked. Please close VS Code and try again.`);
        } else {
          throw error;
        }
      }
    }
  }

  // Copy static config
  copyFileSync('astro.config.static.mjs', originalConfig);
  console.log('✓ Switched to static config\n');

  // Build static site
  console.log('🔨 Running build...\n');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('\n✅ Static build complete!');
  console.log('📁 Static files are in: dist/');
  console.log('\n📤 Next step: Upload dist/ folder contents to Reclaim\n');
} catch (error) {
  console.error('\n❌ Build failed!');
  throw error;
} finally {
  // Restore renamed files (remove underscore prefix)
  for (const renamed of renamedPaths) {
    const { original, renamed: renamedPath } = renamed;
    try {
      if (existsSync(renamedPath)) {
        renameSync(renamedPath, original);
        console.log(`✓ Restored: ${original}`);
      }
    } catch (e) {
      console.warn(`⚠ Warning: Could not restore ${original} - you may need to restore manually`);
    }
  }

  // Restore original config
  if (existsSync(backupConfig)) {
    copyFileSync(backupConfig, originalConfig);
    // Delete backup
    import('fs').then(fs => {
      try {
        fs.unlinkSync(backupConfig);
      } catch (e) {
        // Ignore
      }
    });
    console.log('\n✓ Restored original config');
  }
}

