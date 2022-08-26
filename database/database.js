import {readFileSync} from 'fs';
import {v4 as uuid} from 'uuid';
import {argon2i} from 'argon2-ffi';
import {randomBytes} from 'crypto';
import {meta, __dirname as dirname__} from '../consts.js';
import {dirname, join} from 'path';
import {fileURLToPath} from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let RAW = JSON.parse(readFileSync(join(__dirname, 'db.json'))); let DB = RAW;

const Email=e=>e.match(/^[a-zA-Z0-9_-]*@[a-zA-Z0-9_-]*\.([a-z]{2,})/g) ? e : !1; // Verification of email through format "name@site.tld"

function loadModels(models){
	return new Proxy(Object.keys(models).reduce((a,k)=>(a[k] = new QuerySet(DB[k].map(e=>new models[k](e))), a), {}), {
		set(targ, prop, value){targ[prop] = value}, 
		get(targ, prop){return targ[prop]}})
	return Object.keys(models).reduce((a,k)=>(a[k] = new QuerySet(DB[k].map(e=>new models[k](e))), a), {});
}

class QuerySet{
	#ids; #removed; // Initialize ids and removed, in reality neither are necessary
	constructor(...objs){
		this.objs = objs.flat(); // Flatten, makes it simpler to just dump into the constructor
		this.#ids = new Proxy(this.objs, {get(targ, prop){return targ[prop]?.id ?? Error('out of bounds')}}) // Create a Proxy so ids are always in the same order as objs
	}

	add(...objs){return (this.objs.push(...objs.flat()), this)} // Add using any method: arrays, spread, spread of array
	remove(...objs){this.#removed.push({objs: objs.map(e=>e.id).map(id=>this.objs.splice(this.#ids.indexOf(id), 1)), time: new Date()}); return this} // Remove all items with matching ids
	filter({...crit} = {}, ffunc = null){
		ffunc ??= (obj, {...kws} = {})=>Object.keys(kws).every(kw=>obj[kw] === kws[kw]); // All keys in kws must match with obj's for a match
		return new QuerySet(this.objs.filter(obj=>ffunc(obj, crit)))
	} // Filter using ffunc with crit passed to it: User.objects.filter({id: "dummy"})
	get({...crit}, ffunc = null){return this.filter(crit, ffunc).objs[0]} // Same as filter but returns a single object not a QuerySet of filtered objects
	update({...kw} = {}, exempt = null){return (this.objs.filter(obj=>obj.id !== exempt).map(obj=>Object.assign(obj, kw)), this)} // Update all items in the QuerySet with kw
	order_by(attr, dir = 1, sorted){
		sorted = this.objs.sort((a, b)=>a[attr] - b[attr]);
		return dir === 0 ? sorted.reverse() : sorted;
	}
}

class ObjectManager{
	#type; constructor(kw, ref, id_gen = uuid){
		this.id = kw.id ?? id_gen(); // Either use provided id or create a new one

		//this.created = kw.created ? new Date(kw.created) : new Date(); // Will be run whenever an instance is initialized
		//this.modified = kw.modified ? new Date(kw.modified) : null; // Not modified until it's changed

		this.#type = this.constructor.name;

		return (t=>new Proxy(this, {
			get(targ, prop){return prop === 'type' ? t : prop === 'ref' ? ref : targ[prop]},
			set(targ, prop, value){return (this.modified = new Date(), targ[prop] = value, this)}
		}))(this.#type)
	}

	update({...kw} = {}){return Object.assign(this, kw)} // Simply apply many changes in a single line
	save(){
		this.type.references.map(ref=>this[ref] = this[ref].save());
		let io = DB[this.type].map(e=>e.id).indexOf(this.id);
		io > -1 ? io : DB[this.type].length;
		return (RAW[this.type][io] = JSON.stringify(this, null, '\t'), this);
	} // Persistently update the instance
}

class Reference{
	#crit; #types; #_this; constructor(types, _this = null){this.#types = types; this.#_this = _this} // Using plural of types because it's accessed more so makes more sense
	create(crit, ffunc = null, [reverse, parent] = [null, null]){
		this.#crit = {crit, ffunc}; // Save criteria to be used in .save()
		if(reverse && (parent ??= this.#_this)){ // The parent's data can be passed in two ways
			parent.ref.objects.get({id: parent.id})[reverse] = new Reference(parent.ref).create({id: parent.id}) // Parent reverse accessor
		} // Allow child to find parent through reverse
		if(this.#types.length > crit?.length){throw new Error('Referencing multiple models through single criteria instance is not allowed!')} // Just a safety check
		console.log("Criteria:",crit,"|","_this/parent:",this.#_this??parent)
		return new Proxy(this, { // Proxy it so that data is updated on every query
			get(targ, prop){
				if(prop === 'reference'){ // Simulate initializing this.reference
					if(Reference.isMultiple(crit)){ // If there are multiple criteria to query objects
						const typemap = crit.map(cred=>this.#types.reduce((save, type)=>type.objects.get(cred, ffunc)?.id ? type : save, null)); // Save types for instances
						return new QuerySet(crit.map((crit, i)=>typemap[i].objects.get(crit, ffunc))); // Return a QuerySet for better querying of objects mapped
					}else{
						return this.#types[0].objects.get(crit, ffunc); // There is only a single object, return a query for it
					}
				}else{return targ[prop]} // Not asking for reference, be normal
			}
		})
	}
	save(extra = Reference.isMultiple(this.#crit.crit) ? {types: this.#types} : null){return {...this.#crit, ...extra}} // Call when reference needs to be saved, stores necessary data
	static isMultiple=obj=>obj?.length > 1 ? ((obj?.flat ? obj = obj.flat() : obj), typeof obj[0] === 'object' && obj[0] !== null && !Array.isArray(obj[0])) : !1; // Is array of objs
}

const PROXY = new Proxy(DB, {get(t,p){return new QuerySet(t[p])}});

let models = {
	User: class User extends ObjectManager{
		constructor({...kw} = {}){
			super(kw, models.User);
			
			this.username = kw.username;
			this.email = Email(kw.email); // Validate email

			this.password = kw.passHashed ? kw.password : argon2i.hash(kw.password, randomBytes(32)); // If password is hashed, use it, else start the hash promise
			this.passHashed = true; // The previous line has ensured that the password is hashed
			this.session = kw.session ?? uuid(); // Used as a cookie to mark login, when updated all other logged in sessions are invalidated

			this.author = kw.author ?? false;
			this.staff = kw.staff ?? false;
			this.admin = kw.admin ?? false;
		}

		async verify(pass){return await argon2i.verify(await this.password, pass)} // Returns boolean of whether password matches

		static objects = PROXY.User;
	},
	Template: class Template extends ObjectManager{
		constructor({...kw} = {}){
			super(kw, models.Template);

			this.title = kw.title;
			this.template = kw.template;
			this.description = kw.description;
			this.default = kw.default ?? false;

			this.creator = new Reference(models.User).create(kw?.creator?.crit ?? models.User.objects.get({admin: true}), kw?.creator?.ffunc);
		}

		save(){
			if(this.default){models.Template.objects.update({default: false}, this.id)};
			return super.save();
		}

		static references = ['creator'];

		static objects = PROXY.Template;
	},
	Page: class Page extends ObjectManager{
		constructor({...kw} = {}){
			super(kw, models.Page);

			this.title = kw.title;
			this.description = kw.description;
			this.page = kw.page;
			this.home = kw.home ?? false;

			this.template = new Reference(models.Template).create(kw?.template?.crit ?? models.Template.objects.get({default: true}), kw?.template?.ffunc);
			this.creator = new Reference(models.User).create(kw?.creator?.crit ?? models.User.objects.get(user=>user.admin), kw?.creator?.ffunc);
		}

		save(){
			if(this.home){models.Page.objects.update({home: false}, this.id)};
			return super.save();
		}

		static references = ['template', 'creator'];

		static objects = PROXY.Page;
	},
	// Still WIP
	Theme: class Theme extends ObjectManager{
		constructor({...kw} = {}){
			super(kw, models.Theme);

			this.title = kw.title;
			this.description = kw.description;
			this.path = kw.path;
			this.active = kw.active ?? false;
		}

		save(){
			if(this.active){models.Theme.objects.update({active: false}, this.id)};
			return super.save();
		}

		static objects = PROXY.Theme;
	},
	PluginAuthor: class PluginAuthor extends ObjectManager{
		constructor({...kw} = {}){
			super(kw, models.PluginAuthor);
		}

		static objects = PROXY.PluginAuthor;
	},
	File: class File extends ObjectManager{
		constructor({...kw} = {}){
			super(kw, models.File);

			this.filename = kw.filename;

		}

		static objects = PROXY.File;
	},
	Plugin: class Plugin extends ObjectManager{
		constructor({...kw} = {}){
			super(kw, models.Plugin);

			this.name = kw.name;
			this.version = kw.version;
			this.author = new Reference(models.PluginAuthor).create(kw.crit)
			this.files = new Reference(models.File).create(kw.crit)
		}

		static references = ['files', 'author'];

		static objects = PROXY.Plugin;
	}
}


for await (const plugin of Object.keys(meta.plugins)){
	// Find files that export models and await import(join(__dirname, 'plugins', PLUGINNAME, FILENAME)).default
}

// Object.keys(meta.plugins).reduce((a, c)=>(meta.plugins[c].additions.includes("models") ? a.push(meta.plugins[c]) : null, a), []) // Get all plugins that export models

[...Object.keys(models), ...Object.keys(RAW)]

DB = Object.keys(models).reduce((a,k)=>(a[k] = new QuerySet(DB[k]?.map(e=>new models[k](e))), a), {});

export {DB, QuerySet, ObjectManager, Reference, models};