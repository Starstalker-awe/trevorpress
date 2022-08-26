# Trevorpress

## Database management

### Model syntax

```js
import {ObjectManager} from '../database/database.js'; // Where ./ is trevorpress/plugins/

const models = {
    Page: class Page extends ObjectManager{
        constructor({...kw} = {}){
            super(kw, models.Page);

            this.title = kw.title;
            
        }
    }
}

function Page({...kw} = {}){
    Page.objects = (_=>new QuerySet(DB.Page))()

    const ObjMan = new ObjectManager("Model", kw);
    Object.assign(this, ObjMan);

    this.title = kw.title;
    this.description = kw.description;
    this.page = kw.page;
    this.home = kw.home ?? false;

    this._schema = {
        title: String,
        description: String,
        page: String,
        home: Boolean
    };

    save(){
        if(this.home){Page.objects.update({home: false})}
        return ObjMan.save();
    }
}
```