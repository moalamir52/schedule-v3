const originalConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console)
};

const MAX_BUFFER = 2000;
const buffer = [];

function addToBuffer(level, args) {
  try {
    const text = args.map(a => {
      try { return typeof a === 'string' ? a : JSON.stringify(a); } catch { return String(a); }
    }).join(' ');

    buffer.push({ ts: new Date().toISOString(), level, text });
    if (buffer.length > MAX_BUFFER) buffer.shift();
  } catch (e) {
    // swallow
  }
}

// Replace global console methods so existing console.* calls are captured
// and silenced. To enable original console output set process.env.SHOW_SERVER_LOGS = 'true'.
function install() {
  ['log','info','warn','error'].forEach(level => {
    console[level] = (...args) => {
      addToBuffer(level, args);
      if (process.env.SHOW_SERVER_LOGS === 'true') {
        originalConsole[level](...args);
      }
    };
  });
}

function getBuffer(opts = {}) {
  const { since } = opts;
  if (!since) return buffer.slice();
  return buffer.filter(item => item.ts >= since);
}

function clearBuffer() { buffer.length = 0; }

module.exports = {
  install,
  getBuffer,
  clearBuffer,
  // small helper to add structured assignment logs without having to call console
  assignment: (text) => addToBuffer('assign', [text])
};
