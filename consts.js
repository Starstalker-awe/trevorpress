import {randomBytes} from 'crypto';
import {readFileSync} from 'fs';

import {dirname, join} from 'path';
import {fileURLToPath} from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = 8000;
const nunconf = {autoescape: false};
const SECRET = randomBytes(32);
const meta = JSON.parse(readFileSync(join(__dirname, 'meta.json')));
const tmplt_rt = `themes/${meta.themes[meta.meta.active_theme].route}`;
const index = meta.themes[meta.meta.active_theme].index;

const DEBUG = true;

export {PORT, nunconf, SECRET, meta, tmplt_rt, index, __dirname, DEBUG};