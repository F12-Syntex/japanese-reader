import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

function getAllFiles(dirPath, arrayOfFiles = [], isRoot = false) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    // Skip node_modules, hidden folders, and ignored file types
    if (stat.isDirectory()) {
      if (file === 'node_modules' || file.startsWith('.')) return;

      // Recurse into subdirectories — mark as not root anymore
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles, false);
    } else {
      // Skip unwanted files
      if (
        file.endsWith('.lock') ||
        file.endsWith('.md') ||
        file === '.gitignore' ||
        file.endsWith('.json')
      ) return;

      // Skip root-level files
      if (isRoot) return;

      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function copyToClipboard(text, fileList) {
  const platform = process.platform;
  let command;
  
  if (platform === 'darwin') {
    command = 'pbcopy';
  } else if (platform === 'win32') {
    command = 'clip';
  } else {
    command = 'xclip -selection clipboard';
  }

  const child = exec(command, (error) => {
    if (error) {
      console.error('❌ Error copying to clipboard:', error);
      console.log('\n--- Content that would be copied ---');
      console.log(text);
    } else {
      console.log('✅ Source files copied to clipboard!');
      console.log('\n📁 Files copied:');
      fileList.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file}`);
      });
      console.log(`\n📊 Total: ${fileList.length} file(s)`);
    }
  });

  child.stdin.write(text);
  child.stdin.end();
}

function main() {
  try {
    const currentDir = process.cwd();
    console.log('🔄 Processing files...');
    
    // Mark root scan as root=true
    const files = getAllFiles(currentDir, [], true);
    let output = '';

    files.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf8');
      output += `File: ${filePath}\n`;
      output += `${content}\n\n`;
    });

    copyToClipboard(output, files);
  } catch (error) {
    console.error('❌ Error reading files:', error);
  }
}

main();