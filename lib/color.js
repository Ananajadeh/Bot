/**
 * Terminal Color Helper (Pure ANSI - Zero Dependency)
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',

  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Bright Foreground
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',

  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
};

const colorize = (color, text) => `${colors[color] || ''}${text}${colors.reset}`;

module.exports = {
  colors,
  colorize,
  info: (text) => console.log(`${colors.brightCyan}[INFO]${colors.reset} ${text}`),
  success: (text) => console.log(`${colors.brightGreen}[SUCCESS]${colors.reset} ${text}`),
  warn: (text) => console.log(`${colors.brightYellow}[WARN]${colors.reset} ${text}`),
  error: (text) => console.log(`${colors.brightRed}[ERROR]${colors.reset} ${text}`),
  logMsg: (chat, sender, cmd) => {
    const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
    console.log(
      `${colors.brightBlue}[${time}]${colors.reset} ` +
      `${colors.yellow}${chat}${colors.reset} -> ` +
      `${colors.green}${sender}${colors.reset} : ` +
      `${colors.brightCyan}${cmd}${colors.reset}`
    );
  }
};
