const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define the root directory to search in
const rootDir = './src';

// Pattern to match imports from @/components/ui/ and replace with @/components/ui-migrated/
const importPattern = /@\/components\/ui\//g;
const replacementPath = '@/components/ui-migrated/';

// Get all TypeScript files in the src directory
function getAllTypeScriptFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively get files from subdirectories
      results = results.concat(getAllTypeScriptFiles(filePath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(filePath);
    }
  }
  
  return results;
}

try {
  // Get all TypeScript files
  const filePaths = getAllTypeScriptFiles(rootDir);
  
  console.log(`Found ${filePaths.length} TypeScript files.`);
  
  // Process each file to check for the import pattern
  let updatedCount = 0;
  let matchedFiles = 0;
  
  filePaths.forEach(filePath => {
    try {
      // Read file content
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if it contains the old import pattern
      if (content.match(importPattern)) {
        matchedFiles++;
        
        // Replace old import paths with new ones
        const updatedContent = content.replace(importPattern, replacementPath);
        
        // Only write to file if changes were made
        if (content !== updatedContent) {
          fs.writeFileSync(filePath, updatedContent, 'utf8');
          updatedCount++;
          console.log(`✅ Updated imports in: ${filePath}`);
        }
      }
    } catch (fileErr) {
      console.error(`❌ Error processing file ${filePath}:`, fileErr.message);
    }
  });
  
  console.log(`\nSummary: Updated imports in ${updatedCount} out of ${matchedFiles} files with old imports (${filePaths.length} total files).`);
  console.log('Note: You may need to manually fix any type errors that result from the update.');
  
} catch (err) {
  console.error('Error:', err.message);
} 