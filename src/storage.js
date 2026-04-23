// ============================================================
// OUTPOST ZERO — Save / Load Adapter
//
// All platform-specific storage is isolated here. To port to
// Expo / React Native, replace the localStorage calls with
// AsyncStorage equivalents — the rest of the app is unchanged.
//
// Bump SAVE_VERSION whenever the state shape changes in a way
// that makes old saves incompatible. Mismatched saves are
// discarded gracefully (player starts fresh).
// ============================================================

const KEY = 'outpost_zero_save';
const SAVE_VERSION = 1;

export function saveGame(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...state, _v: SAVE_VERSION }));
  } catch (_) {}
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data._v !== SAVE_VERSION) return null;
    return data;
  } catch (_) {
    return null;
  }
}

export function clearGame() {
  localStorage.removeItem(KEY);
}

// Downloads the current save as a .json file.
// Returns true on success, false if there was nothing to export.
export function exportSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const blob = new Blob([raw], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `outpost-zero-save-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (_) {
    return false;
  }
}

// Validates a JSON string as a compatible save file.
// Returns the parsed object, or null if invalid / wrong version.
export function parseSave(text) {
  try {
    const data = JSON.parse(text);
    if (typeof data !== 'object' || data === null) return null;
    if (data._v !== SAVE_VERSION || !Array.isArray(data.crew)) return null;
    return data;
  } catch (_) {
    return null;
  }
}
