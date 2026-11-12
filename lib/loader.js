/**
 * Modular Command Loader
 * Secara otomatis memuat semua file command dari direktori commands/
 */

const fs = require('fs');
const path = require('path');
const { info, warn, error } = require('./color');

const commands = new Map();
const aliases = new Map();

function loadCommands(dir = path.join(__dirname, '../commands')) {
  commands.clear();
  aliases.clear();

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return;
  }

  function readDirectory(currentDir) {
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        readDirectory(fullPath);
      } else if (file.endsWith('.js')) {
        try {
          // Hapus cache agar bisa di-reload jika file diedit
          delete require.cache[require.resolve(fullPath)];
          const cmd = require(fullPath);

          if (!cmd || !cmd.name || typeof cmd.execute !== 'function') {
            warn(`Melewatkan file tidak valid: ${file}`);
            continue;
          }

          // Otomatis tentukan kategori dari nama folder jika tidak diset
          if (!cmd.category) {
            const relPath = path.relative(dir, fullPath);
            const parts = relPath.split(path.sep);
            cmd.category = parts.length > 1 ? parts[0] : 'general';
          }

          commands.set(cmd.name.toLowerCase(), cmd);

          // Daftarkan alias jika ada
          if (Array.isArray(cmd.aliases)) {
            for (const alias of cmd.aliases) {
              aliases.set(alias.toLowerCase(), cmd);
            }
          }
        } catch (err) {
          error(`Gagal memuat perintah ${file}: ${err.message}`);
        }
      }
    }
  }

  readDirectory(dir);
  info(`Total perintah berhasil dimuat: ${commands.size} perintah`);
}

function getCommand(name) {
  if (!name) return null;
  const lower = name.toLowerCase();
  return commands.get(lower) || aliases.get(lower) || null;
}

function getAllCommands() {
  return Array.from(commands.values());
}

function getCategories() {
  const cats = new Set();
  for (const cmd of commands.values()) {
    cats.add(cmd.category || 'general');
  }
  return Array.from(cats);
}

module.exports = {
  loadCommands,
  getCommand,
  getAllCommands,
  getCategories
};
