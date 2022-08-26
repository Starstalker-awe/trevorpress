import express from 'express';
import cookieParser from 'cookie-parser';
import nunjucks from 'nunjucks';
import * as crypto from 'crypto';
import {models} from '../database/database.js';
import {tmplt_rt, nunconf} from '../consts.js';

const router = express();

nunjucks.configure(tmplt_rt, {...nunconf, express: router});

router.use(cookieParser(crypto.randomBytes(32), {maxAge: 2 * 7 * 24 * 60 * 60 * 1000}))
	.use((req, res, next)=>!req.signedCookies?.id && req.url != '/login' ? res.redirect(`/admin/login?to=${req.url}`) : next())
	.use(express.urlencoded({extended: true}))

router.route('/login')
	.get((req, res)=>res.render('admin/login.njk', {to: req.query?.to}))
	.post(async(req, res)=>{
		const user = models.User.objects.get(user=>user.email == req.body.username || user.username == req.body.username);
		//return Object.keys(user).length ? await user.verify(req.body.password) ? (res.cookie('user', user.id), res.redirect(req.body.to ?? '/')) : res.json({err: 2}) : res.json({err: 1})
		if (Object.keys(user).length){
			if (await user.verify(req.body.password)){
				res.cookie('user', user.id);
			}else{
				return res.json({err: 2})
			}
		}else{
			return res.json({err: 1})
		}
		return res.redirect(req.body.to ?? '/')
	});

router.get('/', (req, res)=>{
	return res.render('admin/index.njk')
})

export {router};