import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const duckdbDir = path.join(__dirname, 'node_modules', 'duckdb');
const pkgPath = path.join(duckdbDir, 'package.json');

if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  
  if (pkg.binary) {
    // 1. Ensure napi_versions exists for Turbopack
    if (!pkg.binary.napi_versions) {
        pkg.binary.napi_versions = [3];
    }

    // 2. Update paths to satisfy node-pre-gyp requirements
    pkg.binary.module_path = "./lib/binding/{napi_build_version}";
    pkg.binary.remote_path = "/{napi_build_version}";
    
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    
    // 3. Copy the binary so duckdb can find it at the new NAPI path
    const bindingDir = path.join(duckdbDir, 'lib', 'binding');
    const napiDir = path.join(bindingDir, '3');
    
    if (fs.existsSync(bindingDir)) {
      if (!fs.existsSync(napiDir)) {
        fs.mkdirSync(napiDir, { recursive: true });
      }
      
      const files = fs.readdirSync(bindingDir);
      for (const file of files) {
        if (file.endsWith('.node')) {
          // Copy the binary into the new '3' folder
          fs.copyFileSync(path.join(bindingDir, file), path.join(napiDir, file));
        }
      }
    }
    console.log('✅ Successfully patched duckdb for both Turbopack and node-pre-gyp compatibility!');
  } else {
    console.log('⚡ duckdb is missing the binary block.');
  }
} else {
  console.log('⚠️ duckdb package.json not found.');
}