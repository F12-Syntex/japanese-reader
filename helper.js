import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

function getAllFiles(dirPath, arrayOfFiles = [], isRoot = false) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file === 'node_modules' || file.startsWith('.')) return;
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles, false);
    } else {
      if (
        file.endsWith('.lock') ||
        file.endsWith('.md') ||
        file === '.gitignore' ||
        file.endsWith('.json')
      ) return;

      if (isRoot) return;

      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function searchFilesByName(files, ...substrings) {
  const lowered = substrings.map(s => s.toLowerCase());
  return files.filter(file => {
    const name = path.basename(file).toLowerCase();
    return lowered.some(sub => name.includes(sub));
  });
}

function searchFilesByContent(files, searchTerm) {
  return files.filter(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return content.toLowerCase().includes(searchTerm.toLowerCase());
    } catch (error) {
      return false;
    }
  });
}


function getFilesByExtension(files, extension) {
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  return files.filter(file => file.endsWith(ext));
}

function getRecentlyModified(files, hours = 24) {
  const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
  return files
    .filter(file => {
      try {
        const stats = fs.statSync(file);
        return stats.mtimeMs > cutoffTime;
      } catch (error) {
        return false;
      }
    })
    .sort((a, b) => {
      const aTime = fs.statSync(a).mtimeMs;
      const bTime = fs.statSync(b).mtimeMs;
      return bTime - aTime;
    });
}

function listFiles(files) {
  console.log('\n📁 Files included:');
  files.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
  });
  console.log(`\n📊 Total: ${files.length} file(s)`);
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

  const child = exec(command, error => {
    if (error) {
      console.error('❌ Error copying to clipboard:', error);
      console.log('\n--- Content that would be copied ---');
      console.log(text);
    } else {
      console.log('✅ Content copied to clipboard!');
      if (fileList) {
        listFiles(fileList);
      }
    }
  });

  child.stdin.write(text);
  child.stdin.end();
}

// ✅ UPDATED FUNCTION — applies CSV, ICO, and truncation logic
function buildOutput(files) {
  let output = '';

  files.forEach(filePath => {
    // Skip .ico entirely
    if (filePath.endsWith('.ico')) return;

    const content = fs.readFileSync(filePath, 'utf8');
    let finalContent = content;

    if (filePath.endsWith('.csv')) {
      const lines = content.split(/\r?\n/).slice(0, 3);
      finalContent = lines.join('\n') + '\n... (truncated CSV preview)\n';
    } else {
      const lines = content.split(/\r?\n/);
      if (lines.length > 300) {
        finalContent = lines.slice(0, 300).join('\n') + '\n... (truncated after 300 lines)\n';
      }
    }

    output += `File: ${filePath}\n`;
    output += `${finalContent}\n\n`;
  });

  return output;
}

// 🌳 Build tree with optional “safe” ASCII output
function buildTreeOutput(dirPath, prefix = '', isRoot = true, useAscii = false) {
  let output = '';
  const files = fs.readdirSync(dirPath);
  const lastIndex = files.length - 1;

  files.forEach((file, index) => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    const isLast = index === lastIndex;

    if (file === 'node_modules' || file.startsWith('.')) return;

    const connector = useAscii ? (isLast ? '\\-- ' : '|-- ') : (isLast ? '└── ' : '├── ');
    const newPrefix = useAscii ? (isLast ? '    ' : '|   ') : (isLast ? '    ' : '│   ');

    if (stat.isDirectory()) {
      output += `${prefix}${connector}${file}/\n`;
      output += buildTreeOutput(fullPath, prefix + newPrefix, false, useAscii);
    } else if (
      !file.endsWith('.lock') &&
      !file.endsWith('.md') &&
      file !== '.gitignore' &&
      !file.endsWith('.json')
    ) {
      output += `${prefix}${connector}${file}\n`;
    }
  });

  return output;
}

function showHelp() {
  const helpText = `
📚 Code Helper - Smart Codebase Navigator

Usage: node helper [command] [argument(s)]

Commands:
  (no args)              Copy all code files to clipboard

  ? or help              Show this help message

  name <substring(s)>    Find files containing one or more substrings in filename
  content <term>         Find files containing term in their content
  ext <extension>        Get all files with specific extension
  recent [hours]         Get recently modified files (default: 24h)
  list                   List all files and copy to clipboard
  tree                   Show directory tree structure and copy to clipboard

Exclusions and Formatting:
  - .ico files skipped entirely
  - .csv files: first 3 lines only
  - Files >300 lines truncated

Examples:
  node helper
  node helper name component
  node helper content API
  node helper ext .js
  node helper recent 12
  node helper tree
`;

  console.log(helpText);
  copyToClipboard(helpText.trim());
}

function main() {
  try {
    const currentDir = process.cwd();
    const args = process.argv.slice(2);
    const command = args[0]?.toLowerCase();
    const argument = args[1];

    if (command === '?' || command === 'help') {
      showHelp();
      return;
    }

    if (command === 'tree') {
      console.log('📂 Project Structure:');
      console.log(path.basename(currentDir) + '/');
      const fancyTree = path.basename(currentDir) + '/\n' + buildTreeOutput(currentDir, '', true, false);
      const safeTree = path.basename(currentDir) + '/\n' + buildTreeOutput(currentDir, '', true, true);
      copyToClipboard(safeTree); // copy ASCII-safe tree
      console.log(fancyTree);    // pretty tree in terminal
      return;
    }

    console.log('🔄 Processing files...');
    const allFiles = getAllFiles(currentDir, [], true);
    let selectedFiles = allFiles;
    let output = '';

    if (command === 'name' && args.length > 1) {
      selectedFiles = searchFilesByName(allFiles, ...args.slice(1));
      console.log(`🔍 Searching filenames: ${args.slice(1).join(', ')}`);
      const project = path.basename(currentDir);
      const structure = `${project}/\n${buildTreeOutput(currentDir, '', true, true)}`;
      const files = buildOutput(selectedFiles);
      output = `<structure>\n${structure}\n\n<files>\n${files}`;
    } else if (command === 'content' && argument) {
      selectedFiles = searchFilesByContent(allFiles, argument);
      console.log(`🔍 Searching for content "${argument}"...`);
      output = buildOutput(selectedFiles);
    } else if (command === 'ext' && argument) {
      selectedFiles = getFilesByExtension(allFiles, argument);
      console.log(`🔍 Files with extension "${argument}"...`);
      output = buildOutput(selectedFiles);
    } else if (command === 'recent') {
      const hours = argument ? parseInt(argument, 10) : 24;
      selectedFiles = getRecentlyModified(allFiles, hours);
      console.log(`⏰ Files modified in last ${hours}h...`);
      output = buildOutput(selectedFiles);
    } else if (command === 'list') {
      console.log('📋 Listing all files...');
      output = buildOutput(selectedFiles);
    } else if (command && command !== 'name') {
      console.log(`⚠️ Unknown command: "${command}"`);
      console.log('💡 Use "node helper ?" for help');
      return;
    } else {
      console.log('📋 Copying all files (with truncation rules)...');
      output = buildOutput(selectedFiles);
    }

    if (selectedFiles.length === 0) {
      console.log('❌ No files found matching criteria');
      return;
    }

    copyToClipboard(output, selectedFiles);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();