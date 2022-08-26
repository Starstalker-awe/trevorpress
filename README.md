# Trevorpress

## Project overview

This project is a CMS, with the objective of being similar in capabilities to Wordpress, but built in Node.js.

## Database management

### Model syntax

```js
import {ObjectManager} from '../database/database.js'; // Where ./ is trevorpress/plugins/

const models = {
    Page: class Page extends ObjectManager{
        constructor({...kw} = {}){
            super(kw, models.Page);

            this.title = kw.title;
            this.description = kw.description;
            this.page = kw.page;
            this.home = kw.home ?? false;
        }
        save(){
            if(this.home){this.ref.objects.update({home: false}, this.id)}
            return super.save();
        }
    }
}
```
