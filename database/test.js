import {v4 as uuid} from 'uuid';

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
		console.log("Referencing:",crit,"|","_this/parent:",this.#_this??parent);
		return ((types)=>new Proxy(this, { // Proxy it so that data is updated on every query
			get(targ, prop){
				if(prop === 'reference'){ // Simulate creating this.reference
					if(Reference.isMultiple(crit)){ // If there are multiple criteria to query objects
						const typemap = Array.isArray(types) ? crit.map(cred=>types.reduce((save, type)=>type.objects.get(cred, ffunc)?.id ? type : save, null)) : Array.from(Array(crit.length),_=>types); // Save types for instances
						return new QuerySet(crit.map((crit, i)=>typemap[i].objects.get(crit, ffunc))); // Return a QuerySet for better querying of objects mapped
					}else{
						return types.objects.get(crit, ffunc); // There is only a single object, return a query for it
					}
				}else{return targ[prop]} // Not asking for reference, be normal
			}
		}))(this.#types)
	}
	save(extra = Reference.isMultiple(this.#crit.crit) ? {types: this.#types} : null){return {...this.#crit, ...extra}} // Call when reference needs to be saved, stores necessary data
	static isMultiple=obj=>obj?.length > 1 ? ((obj?.flat ? obj = obj.flat() : obj), typeof obj[0] === 'object' && obj[0] !== null && !Array.isArray(obj[0])) : !1; // Is array of objs
}

let RAW = {
    Person: [
        {id: 1, name: "person 1", following: {crit: [{id: 2}, {id: 3}]}},
        {id: 2, name: "person 2", following: {crit: {id: 3}}},
        {id: 3, name: "person 3"}
    ]
};
let DB = RAW;

const PROXY = new Proxy(DB, {get(t,p){return new QuerySet(t[p])}});

const models = {
    Person: class Person extends ObjectManager{
        constructor({...kw} = {}){
            super(kw, models.Person);

            this.name = kw.name;
            this.following = new Reference(models.Person, this).create(kw?.following?.crit, kw?.following?.ffunc); 
			// QuerySet.objs is not a proxy so they aren't constructed in DB before becoming part of the DB proxy
        }
        static objects = PROXY.Person;
    }
}

DB = Object.keys(models).reduce((a,k)=>(a[k] = new QuerySet(DB[k]?.map(e=>new models[k](e))), a), {});

console.log("DB:", DB)

console.log(models.Person.objects.objs)
console.log(new Reference(models.Person, "A test").create({id: 1}).reference)
console.log(new Reference(models.Person, "Second test").create([{id: 2}, {id: 3}]).reference.filter)