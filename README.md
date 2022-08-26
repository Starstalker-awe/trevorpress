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