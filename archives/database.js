/*import * as fs from 'fs';
import * as uuid from 'uuid';
import {argon2i} from 'argon2-ffi';
import * as crypto from 'crypto';
import {meta} from '../consts.js';
import {dirname, join} from 'path';
import {fileURLToPath} from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let DB = JSON.parse(fs.readFileSync('./database/db.json')) //join(server.__dirname, 'database/db.json')));

// ======================== Start Model Loading ========================

// ======================== End Model Loading ========================

const global_id_namespace = [];

function QuerySet(...objects){
	this.objs = objects.flat();

	this.add = function add(...os){this.objs.push(...os); return this}
	this.remove = function remove(...os){os.map(e=>this.objs.map(o=>o.id).indexOf(e.id)).forEach(i=>this.objs.splice(i, 1)); return this}
	this.filter = function filter(ffunc, ...args){ffunc ??= (obj, id)=>obj.id === id; return new QuerySet(...this.objs.filter(object=>ffunc(object, ...args)))}
	this.filter = function filter(ffunc, ...args){
		
	}
	this.get = function get(filter, ...args){return this.filter(filter, ...args).objs[0]}
	this.update = function update({...kw} = {}){this.objs.map(e=>Object.assign(e, kw)).forEach(e=>e.save()); return this}
}

function ObjectManager(dbcol, kw){
	this._typeof = dbcol;
	this.id = kw.id ?? uuid.v4();
	this.created = kw.created ?? null;
	this.modified = kw.modified ?? null;

	this.update = function update({...kw} = {}){
		Object.assign(this, kw);
		this.save();
	}

	this.save = function save(io=null){
		this.created ??= new Date(), this.modified = new Date();
		return ((io = DB[this._typeof].map(e=>e.id).indexOf(this.id)) > -1 ? DB[this._typeof][io] = JSON.stringify(this) : (DB[this._typeof].push(JSON.stringify(this))), this);
	}
}

// Usage example: this.creator = new ForeignKey(models.User, {rcred: {id: some_users_id}}, models.User.objects.get(user=>user.admin).id)
function ForeignKey(to, {ffunc = null, rcred}, def_cred){
	const model = models[to].objects.get(ffunc, rcred ?? def_cred);
}

// Database class definitions
let models = {
	User: function User({...kw} = {}){
		models.User.objects = new Proxy(DB, {get(t,p){return new QuerySet(t[p])}}).User;
		
		Object.assign(this, new ObjectManager("User", kw));
	
		this.username = kw.username;
		this.email = kw.email;
	
		this.password = kw.passHashed ? kw.password : argon2i.hash(kw.password, crypto.randomBytes(32));
		this.passHashed = true;
		this.session = kw.session ?? uuid.v4();
	
		this.author = kw.author ?? false;
		this.staff = kw.staff ?? false;
		this.admin = kw.admin ?? false;
	
		this._schema = {
			username: String,
			email: String,
			password: String,
			passHashed: Boolean,
			session: String,
			author: Boolean,
			staff: Boolean,
			admin: Boolean
		}
		
		this.verify = async pass=>await argon2i.verify(this.password, pass);
	},
	
	Template: function Template({...kw} = {}){
		models.Template.objects = new Proxy(DB, {get(t,p){return new QuerySet(t[p])}}).Template;
		
		const ObjMan = new ObjectManager("Template", kw);
		Object.assign(this, ObjMan);
		
		this.title = kw.title;
		this.template = kw.template;
		this.description = kw.description;
		this.default = kw.default ?? false;
		
		this.creator = models.User.objects.get(null, kw.creator ?? models.User.objects.get(user=>user.admin).id)
		
		this._schema = {
			title: String,
			template: String,
			description: String,
			default: Boolean,
			creator: models.User
		}
	
		this.save = function save(){
			if(this.default){models.Template.objects.update({default: false})}
			return ObjMan.save();
		}
	},
	
	Page: function Page({...kw} = {}){
		models.Page.objects = new Proxy(DB, {get(t,p){return new QuerySet(t[p])}}).Page;
	
		const ObjMan = new ObjectManager("Page", kw);
		Object.assign(this, ObjMan);
	
		this.title = kw.title;
		this.description = kw.description;
		this.home = kw.home ?? false;
		this.page = kw.page;
		
		this.template = models.Template.objects.get(null, kw.template ?? models.Template.objects.get(template=>template.default).id);
		this.creator = models.User.objects.get(null, kw.creator ?? models.User.objects.get(user=>user.admin).id);
	
		this._schema = {
			title: String,
			description: String,
			home: Boolean,
			page: String,
			template_id: models.Template,
			creator: models.User
		}
	
		this.save = function save(){
			if(this.home){models.Page.objects.update({home: false})};
			return ObjMan.save();
		}
	},
	
	Piece: function Piece({...kw} = {}){
		models.Piece.objects = new Proxy(DB, {get(t,p){return new QuerySet(t[p])}}).Piece;
		
		Object.assign(this, new ObjectManager("Piece", kw));
		
		this.title = kw.title;
		this.description = kw.description;
		
		this.creator = models.User.objects.get(null, kw.creator ?? models.User.objects.get(user=>user.admin))
	
		this._schema = {
			title: String,
			description: String,
			creator: models.User
		}
	}
}

//console.log(server.pluginJson.filter(plugin=>plugin.additions.includes('models')))

DB = Object.keys(models).reduce((a,k)=>(a[k] = new QuerySet(DB[k].map(e=>new models[k](e))), a), {})

console.log(DB)

export {DB, QuerySet, ObjectManager, models};*/