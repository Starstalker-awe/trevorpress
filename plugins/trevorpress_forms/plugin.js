
import {ObjectManager, DB, QuerySet, Reference, models as _models} from '../../database/database.js';
import {JSDOM} from 'jsdom';

const document = new JSDOM('<!DOCTYPE html>').window.document;

const models = {
    Field: class Field extends ObjectManager{
        constructor({...kw} = {}){
            super(kw);

            const types = ["text", "button", "checkbox", "color", "date", "datetime-local", "email", "file", "hidden", "image", "month", "number", "password", "radio", "range", "reset", "search", "submit", "tel", "time", "url", "week", undefined, null];
            if(!(kw.type in types)){throw new Error(`Invalid type: ${kw.type}`)}else{this.type = kw.type ?? types[0]}

            this.name = kw.name;
            this.placeholder = kw.placeholder ?? null;
            this.autofocus = kw.autofocus ?? false;
            this.readonly = kw.readonly ?? false;
            this.required = kw.required ?? true;
        }

        render(){
            return Object.assign(document.createElement('input'), this)
        }

        static objects = new Proxy(DB, {get(t,p){return new QuerySet(t[p])}}).Field;
    },
    Form: class Form extends ObjectManager{
        constructor({...kw} = {}){
            super(kw);

            this.name = kw.name;
            this.description = kw.description;

            this.fields = new Reference("Field", this).create(kw.fields, null, ["belongs_to", this]);
            this.creator = new Reference("User", this).create({id: kw.creator ?? _models.User.objects.get(user=>user.admin).id});
        }

        static references = ['fields', 'creator'];

        save(){
            Form.references.map(ref=>this[ref] = this[ref].save());
            return super.save();
        }

        static objects = new Proxy(DB, {get(t,p){return new QuerySet(t[p])}}).Form;
    }
}

const models2 = {
    Field: function Field({...kw} = {}){
        models.Field.objects = new Proxy(DB, {get(t,p){return new QuerySet(t[p])}}).Field;

        Object.assign(this, new ObjectManager("Field", kw));
    
        const types = ["text", "button", "checkbox", "color", "date", "datetime-local", "email", "file", "hidden", "image", "month", "number", "password", "radio", "range", "reset", "search", "submit", "tel", "time", "url", "week", undefined];
        if(!(kw.type in types)){throw new Error(`Invalid type: ${kw.type}`)}else{this.type = kw.type ?? types[0]}
    
        this.name = kw.name;
        this.placeholder = kw.placeholder ?? null;
        this.autofocus = kw.autofocus ?? false;
        this.readonly = kw.readonly ?? false;
        this.required = kw.required ?? true;
    
        this._schema = {
            name: String,
            placeholder: String,
            autofocus: Boolean,
            readonly: Boolean,
            required: Boolean
        }
    
        function render(){
            return Object.assign(document.createElement('input'), this)
        }
    },
    
    Form: function Form({...kw} = {}){
        models.Form.objects = new Proxy(DB, {get(t,p){return new QuerySet(t[p])}}).Form;

        const ObjMan = new ObjectManager("Form", kw);
        Object.assign(this, ObjMan);
    
        this.name = kw.name;
        this.description = kw.description;
    
        this.fields = kw.fields.map(field=>new Field(field));
        this.creator = _models.User.objects.get(null, kw.creator ?? _models.User.objects.get(user=>user.admin).id);
    
        this._schema = {
            name: String,
            description: String,
            fields: Array,
            creator: _models.User
        }
    
        function render(form=document.createElement('form')){
            return (this.fields.map(field=>form.appendChild(field.render())), form);
        }
        function save(){
            if(this.fields.map(e=>e.autofocus).reduce((a,f)=>f ? ++a : a, 0) > 1){return new Error('Only one autofocus!')}
            return ObjMan.save();
        }
    }
}

export default models;