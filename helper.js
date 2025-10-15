import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file === 'node_modules') return; // Skip node_modules
      if (file.startsWith('.')) return; // Skip .* paths

      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      if (file.endsWith('.lock') || file.endsWith('.md') || file === '.gitignore') return;
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}


function copyToClipboard(text, fileList) {
  // Detect OS and use appropriate clipboard command
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
    const files = getAllFiles(currentDir);
    let output = '';

    console.log('🔄 Processing files...');
    
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