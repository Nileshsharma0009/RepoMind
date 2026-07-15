import path from 'path';

/**
 * Classifies a file based on its directory path and filename pattern.
 * @param {string} filePath - Absolute or relative file path
 * @returns {string} File classification type
 */
export const classifyFile = (filePath) => {
  const normalizedPath = filePath.toLowerCase().replace(/\\/g, '/');
  const filename = path.basename(normalizedPath);

  if (normalizedPath.includes('/routes/') || filename.includes('.routes.') || filename.includes('.route.')) {
    return 'route';
  }
  if (normalizedPath.includes('/controllers/') || filename.includes('.controller.')) {
    return 'controller';
  }
  if (normalizedPath.includes('/services/') || filename.includes('.service.')) {
    return 'service';
  }
  if (normalizedPath.includes('/models/') || filename.includes('.model.')) {
    return 'model';
  }
  if (
    normalizedPath.includes('/components/') ||
    normalizedPath.includes('/pages/') ||
    filename.endsWith('.jsx') ||
    filename.endsWith('.tsx')
  ) {
    return 'component';
  }
  if (normalizedPath.includes('/middleware/')) {
    return 'middleware';
  }
  if (normalizedPath.includes('/config/')) {
    return 'config';
  }
  if (
    filename.endsWith('.css') ||
    filename.endsWith('.scss') ||
    filename.endsWith('.sass') ||
    filename.endsWith('.less')
  ) {
    return 'style';
  }
  if (filename.endsWith('.md')) {
    return 'markdown';
  }

  return 'other';
};

/**
 * Parses imports and exports from a file's string content using regex patterns.
 * Supports JS, TS, Python, and Java.
 * @param {string} content - File content
 * @param {string} ext - File extension (e.g. '.js')
 * @returns {object} Object with { imports, exports } arrays
 */
export const parseImportsAndExports = (content, ext = '') => {
  const imports = new Set();
  const exports = new Set();

  if (!content) return { imports: [], exports: [] };

  const cleanExt = ext.toLowerCase();

  // JavaScript, TypeScript, JSX, TSX
  if (['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'].includes(cleanExt)) {
    // 1. ES Modules Imports: import ... from 'source'
    const esImportRegex = /import\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = esImportRegex.exec(content)) !== null) {
      if (match[1]) imports.add(match[1]);
    }

    // 2. Dynamic/CommonJS imports: require('source') or import('source')
    const requireRegex = /(?:require|import)\(['"]([^'"]+)['"]\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      if (match[1]) imports.add(match[1]);
    }

    // 3. Exports
    // Named exports: export const x = ... or export function x()
    const namedExportRegex = /export\s+(?:const|let|var|function|class|interface|type)\s+([a-zA-Z0-9_$]+)/g;
    while ((match = namedExportRegex.exec(content)) !== null) {
      if (match[1]) exports.add(match[1]);
    }

    // Default export: export default x
    const defaultExportRegex = /export\s+default\s+([a-zA-Z0-9_$]+)?/g;
    while ((match = defaultExportRegex.exec(content)) !== null) {
      const name = match[1] || 'default';
      exports.add(name);
    }

    // CommonJS exports: module.exports = ... or exports.x = ...
    const cjsModuleExports = /module\.exports\s*=\s*([a-zA-Z0-9_$]+)/g;
    while ((match = cjsModuleExports.exec(content)) !== null) {
      if (match[1]) exports.add(match[1]);
    }
    const cjsExportsRegex = /exports\.([a-zA-Z0-9_$]+)\s*=/g;
    while ((match = cjsExportsRegex.exec(content)) !== null) {
      if (match[1]) exports.add(match[1]);
    }
  }

  // Python
  else if (cleanExt === '.py') {
    // import x, y, z
    const pyImportRegex = /^import\s+([\w\s,._]+)/gm;
    let match;
    while ((match = pyImportRegex.exec(content)) !== null) {
      match[1].split(',').forEach((pkg) => imports.add(pkg.trim()));
    }

    // from x import y
    const pyFromImportRegex = /^from\s+([\w.]+)\s+import/gm;
    while ((match = pyFromImportRegex.exec(content)) !== null) {
      if (match[1]) imports.add(match[1]);
    }

    // Functions/Classes as exports
    const pyExportRegex = /^(?:def|class)\s+([a-zA-Z0-9_]+)/gm;
    while ((match = pyExportRegex.exec(content)) !== null) {
      if (match[1]) exports.add(match[1]);
    }
  }

  // Java
  else if (cleanExt === '.java') {
    // import x.y.z;
    const javaImportRegex = /^import\s+([\w.]+);/gm;
    let match;
    while ((match = javaImportRegex.exec(content)) !== null) {
      if (match[1]) imports.add(match[1]);
    }

    // Public classes/methods/interfaces as exports
    const javaExportRegex = /public\s+(?:class|interface|enum|@interface)\s+([a-zA-Z0-9_]+)/g;
    while ((match = javaExportRegex.exec(content)) !== null) {
      if (match[1]) exports.add(match[1]);
    }
  }

  return {
    imports: Array.from(imports),
    exports: Array.from(exports),
  };
};

export default {
  classifyFile,
  parseImportsAndExports,
};
