#!/usr/bin/env node

/**
 * Component Migration Script for Card Profit Pro
 * 
 * Usage: 
 *   node scripts/migrate-component.js <component-name>
 * 
 * Example:
 *   node scripts/migrate-component.js badge
 * 
 * Making the script executable:
 *   - On Linux/Mac: chmod +x scripts/migrate-component.js
 *   - On Windows: No need to make executable, just run with node
 * 
 * Then you can run it directly (Linux/Mac only):
 *   ./scripts/migrate-component.js badge
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const sourceDir = path.join(process.cwd(), 'components/ui');
const targetDir = path.join(process.cwd(), 'src/components/ui-migrated');
const testFilePath = path.join(process.cwd(), 'src/components/test-component-imports.tsx');

// Ensure the target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`Created directory: ${targetDir}`);
}

// Get component name from command line args
const componentName = process.argv[2];

// DEBUG: Log the received component name
console.log(`DEBUG: Received componentName argument: '${componentName}'`);

if (!componentName) {
  console.error('Please provide a component name to migrate');
  console.log('Usage: node scripts/migrate-component.js <component-name>');
  process.exit(1);
}

const sourceFile = path.join(sourceDir, `${componentName}.tsx`);
const targetFile = path.join(targetDir, `${componentName}.tsx`);

// Check if source file exists
if (!fs.existsSync(sourceFile)) {
  console.error(`Source file does not exist: ${sourceFile}`);
  process.exit(1);
}

// Check if target file already exists
if (fs.existsSync(targetFile)) {
  console.error(`Target file already exists: ${targetFile}`);
  console.log('Use --force to overwrite');
  process.exit(1);
}

try {
  // Read the source file
  const sourceContent = fs.readFileSync(sourceFile, 'utf8');
  
  // Process imports to use @/ prefix
  let processedContent = sourceContent
    .replace(/from ["']\.\.\/lib\/(.*?)["']/g, 'from "@/lib/$1"')
    .replace(/from ["']\.\.\/hooks\/(.*?)["']/g, 'from "@/hooks/$1"')
    .replace(/from ["']\.\.\/components\/(.*?)["']/g, 'from "@/components/$1"');
  
  // Write the processed content to the target file
  fs.writeFileSync(targetFile, processedContent);
  console.log(`✅ Migrated ${componentName}.tsx to ${targetDir}`);
  
  // Record in migration guide
  const migrationGuidePath = path.join(process.cwd(), 'docs/migration-guide.md');
  if (fs.existsSync(migrationGuidePath)) {
    let guideContent = fs.readFileSync(migrationGuidePath, 'utf8');
    // Check if it's already marked as migrated
    if (!guideContent.includes(`✅ \`${componentName}.tsx\``)) {
      // Find pending migration section and mark as completed
      guideContent = guideContent.replace(
        `⏳ \`${componentName}.tsx\``, 
        `✅ \`${componentName}.tsx\``
      );
      fs.writeFileSync(migrationGuidePath, guideContent);
      console.log(`✅ Updated migration guide for ${componentName}.tsx`);
    }
  }
  
  // Update test file to import the component
  if (fs.existsSync(testFilePath)) {
    let testContent = fs.readFileSync(testFilePath, 'utf8');
    
    // Get export names from the component
    const exportMatches = processedContent.match(/export\s+{([^}]+)}/);
    
    if (exportMatches && exportMatches[1]) {
      const exportNames = exportMatches[1]
        .split(',')
        .map(name => name.trim());
      
      if (exportNames.length > 0) {
        // Add import statement if it doesn't exist
        const importStatement = `import { ${exportNames.join(', ')} } from './ui-migrated/${componentName}';\n`;
        
        if (!testContent.includes(`from './ui-migrated/${componentName}'`)) {
          // Insert after the last import
          const lastImportIndex = testContent.lastIndexOf('import ');
          const lastImportEndIndex = testContent.indexOf('\n', lastImportIndex);
          
          testContent = 
            testContent.slice(0, lastImportEndIndex + 1) + 
            importStatement + 
            testContent.slice(lastImportEndIndex + 1);
          
          fs.writeFileSync(testFilePath, testContent);
          console.log(`✅ Updated test file to import ${componentName}`);
        }
      }
    }
  }
  
  console.log('\n✨ Component migration completed successfully\n');
  
} catch (error) {
  console.error('Error during migration:', error);
  process.exit(1);
} 