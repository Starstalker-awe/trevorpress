// Import and load all models then export
import {models as _models, DB} from './database.js';
import * as consts from '../consts.js';
import {join} from 'path';

const things = await Object.keys(consts.meta.plugins).reduce((a, c)=>(consts.meta.plugins[c].additions.includes("models") ? a.push(consts.meta.plugins[c]) : null, a), []).reduce(async(a, c)=>Object.assign(a, await c.files.filter(file=>file.exports.includes("models")).reduce(async(a2, c2)=>Object.assign(a2, await import(join(consts.__dirname, 'plugins', c.name, c2.fname)).default), {})), {})

console.log(things)