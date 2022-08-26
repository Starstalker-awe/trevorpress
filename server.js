import cookieParser from 'cookie-parser';
import express from 'express';
import * as crypto from 'crypto';
import * as fs from 'fs';
import nunjucks from 'nunjucks';
import {join} from 'path';
import * as db from './database/database.js';
import * as consts from './consts.js';

const app = express();

// ======================== Start Plugin Loading ========================
const additions = ['models', 'views', 'templates', 'pieces'];

// For all plugins that export views use "app" on "use"
Object.keys(consts.meta.plugins).reduce((a, c)=>(consts.meta.plugins[c].additions.includes("views") ? a.push(consts.meta.plugins[c]) : null, a), []).map(plugin=>{
	const viewnames = plugin.files.filter(file=>file.exports.includes("views"));
	if (viewnames.length > 0){
		viewnames.map(async views=>{
			const import_ = await import(join(consts.__dirname, 'plugins', plugin.name, views.fname));
			app.use(import_.use, import_.app);
		})
	}
})
for await (const viewfile of )
// ======================== End Plugin Loading ========================

// ======================== Start Middleware Config ========================
nunjucks.configure(consts.tmplt_rt, {...consts.nunconf, express: app}); // Configure template route

app.use(cookieParser(consts.SECRET, {maxAge: 2 * 7 * 24 * 60 * 60 * 1000})) // Cookie setup
	.use(express.static(join(consts.__dirname, 'static'))) // Static files
	.use(express.urlencoded({extended: true})) // Allow form posting

//await fs.readdirSync('./views').map(async e=>await import(`./views/${e}`).then(mod=>app.use(`/${e.split('.')[0]}`, mod.router))); // Take everything in ./views and add their router
for await (const viewfile of fs.readdirSync('./views')){
	const view = await(await import(`./views/${viewfile}`)).router;
	app.use('/' + viewfile.split('.')[0], view);
	console.log(view._router.stack)
}
// ======================== End Middleware Config ========================

app.get('/', (req, res)=>{
	return res.render(`${consts.index}.njk`);
});

app.get('/about', (req, res)=>{
	return res.render('about.njk');
})

export default app;

// ======================== Start Server Handle ========================
const server = app.listen(consts.PORT, _=>{console.log(`Server running! 127.0.0.1:${consts.PORT}`)});
process.on('SIGINT', (_=>server.close(_=>{console.log(`\rServer stopping!`); process.exit(0)})));
// ======================== End Server Handle =======================