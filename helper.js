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

function buildOutput(files) {
  let output = '';
  files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    output += `File: ${filePath}\n`;
    output += `${content}\n\n`;
  });
  return output;
}

function buildTreeOutput(dirPath, prefix = '', isRoot = true) {
  let output = '';
  const files = fs.readdirSync(dirPath);

  files.forEach((file, index) => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    const isLast = index === files.length - 1;

    if (file === 'node_modules' || file.startsWith('.')) return;

    const connector = isLast ? '└── ' : '├── ';
    const newPrefix = isLast ? '    ' : '│   ';

    if (stat.isDirectory()) {
      const line = prefix + connector + file + '/\n';
      output += line;
      output += buildTreeOutput(fullPath, prefix + newPrefix, false);
    } else {
      if (
        !file.endsWith('.lock') &&
        !file.endsWith('.md') &&
        file !== '.gitignore' &&
        !file.endsWith('.json')
      ) {
        const line = prefix + connector + file + '\n';
        output += line;
      }
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

  ? or help              Show this help message (copied to clipboard)

  name <substring(s)>    Find files containing one or more substrings in filename
                         Example: node helper name user service utils

  content <term>         Find files containing term in their content
                         Example: node helper content "useState"

  ext <extension>        Get all files with specific extension
                         Example: node helper ext .tsx

  recent [hours]         Get recently modified files (default: 24 hours)
                         Example: node helper recent 2

  list                   List all files and copy to clipboard

  tree                   Show directory tree structure and copy to clipboard

Examples:
  node helper                    # Copy everything
  node helper name component     # Files with "component" in name
  node helper name user service  # Files with "user" or "service" in name
  node helper content API        # Files containing "API"
  node helper ext .js            # All JavaScript files
  node helper recent 12          # Files modified in last 12 hours
  node helper tree               # Visual directory structure
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

    // Show help
    if (command === '?' || command === 'help') {
      showHelp();
      return;
    }

    // Show tree
    if (command === 'tree') {
      console.log('📂 Project Structure:');
      const rootName = path.basename(currentDir) + '/\n';
      console.log(path.basename(currentDir) + '/');
      const treeOutput = rootName + buildTreeOutput(currentDir);
      copyToClipboard(treeOutput);
      return;
    }

    console.log('🔄 Processing files...');
    const allFiles = getAllFiles(currentDir, [], true);

    let selectedFiles = allFiles;
    let output = '';

    // ✅ Modified "name" command to include structure
    if (command === 'name' && args.length > 1) {
      selectedFiles = searchFilesByName(allFiles, ...args.slice(1));
      console.log(`🔍 Searching for files with names including: ${args.slice(1).join(', ')}`);

      // Build structure + file contents
      const projectName = path.basename(currentDir);
      const structure = `${projectName}/\n${buildTreeOutput(currentDir)}`;
      const filesSection = buildOutput(selectedFiles);
      output = `<structure>\n${structure}\n\n<files>\n${filesSection}`;
    } else if (command === 'content' && argument) {
      selectedFiles = searchFilesByContent(allFiles, argument);
      console.log(`🔍 Searching for files containing "${argument}"...`);
      output = buildOutput(selectedFiles);
    } else if (command === 'ext' && argument) {
      selectedFiles = getFilesByExtension(allFiles, argument);
      console.log(`🔍 Filtering files with extension "${argument}"...`);
      output = buildOutput(selectedFiles);
    } else if (command === 'recent') {
      const hours = argument ? parseInt(argument, 10) : 24;
      selectedFiles = getRecentlyModified(allFiles, hours);
      console.log(`🔍 Finding files modified in last ${hours} hours...`);
      output = buildOutput(selectedFiles);
    } else if (command === 'list') {
      console.log('📋 Listing all files...');
      output = buildOutput(selectedFiles);
    } else if (command && command !== 'name') {
      console.log(`⚠️  Unknown command: "${command}"`);
      console.log('💡 Use "node helper ?" for help\n');
      return;
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