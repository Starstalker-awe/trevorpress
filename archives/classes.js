class QuerySet{
	constructor(...os){
		this.objs = os.flat();
	}
	add(...os){this.objs.push(...os); return this}
	remove(...os){os.map(e=>this.objs.map(o=>o.id).indexOf(e.id)).forEach(i=>this.objs.splice(i, 1)); return this}
	filter(ffunc, ...args){ffunc ??= (obj, id)=>obj.id === id; return new QuerySet(...this.objs.filter(object=>ffunc(object, ...args)))}
	get(filter, ...args){return this.filter(filter, ...args).objs[0]}
	update({...kw} = {}){this.objs.map(e=>Object.assign(e, kw)).forEach(e=>e.save()); return this}
}

class ObjectManager{
	constructor(dbcol, kw){
		this._typeof = dbcol;
		this.id = kw?.id ?? uuid.v4();
		this.created = kw?.created ?? null;
		this.modified = kw?.modified ?? null;
	}
	save(io=null){
		this.created ??= new Date(), this.modified = new Date();
		return ((io = DB[this._typeof].map(e=>e.id).indexOf(this.id)) > -1 ? DB[this._typeof][io] = JSON.stringify(this) : (DB[this._typeof].push(JSON.stringify(this))), this);
	}
}

class User extends ObjectManager{
	constructor({...kw} = {}){
		super(kw);

		this.username = kw.username;
		this.email = kw.email;

		this.password = kw.passHashed ? kw.password : argon2i.hash(kw.password, crypto.randomBytes(32));
		this.passHashed = true;
		this.session = kw.session ?? uuid.v4();

		this.author = kw.author ?? false;
		this.staff = kw.staff ?? false;
		this.admin = kw.staff ?? false;
	}
	static objects = null
}

class Template extends ObjectManager{
	constructor({...kw} = {}){
		super(kw);
		this.title = kw.title;
		this.template = kw.template;
		this.description = kw.description ?? null;
		
		this.creator = kw.creator;
	}
	save(){
		if(this.default){Template.objects.update({default: false})}
		return super.save();
	}
	static objects = null
}

class Page extends ObjectManager{
	constructor({...kw} = {}){
		super(kw);

		this.title = kw.title;
        this.description = kw.description;
        this.page = kw.page;
        this.home = kw.home ?? false;

		this.template_id = kw.template_id;
		this.creator = kw.creator;
	}
    save(){
        if(this.home){Page.objects.update({home: false})}
        return super.save();
    }
	static objects = null
}

class Piece extends ObjectManager{
	// Use similar _typeof
	constructor({...kw} = {}){
		super(kw);
		this.title = kw.title;
		this.description = kw.description;

		this.creator = kw.creator;
	}
	static objects = null
}