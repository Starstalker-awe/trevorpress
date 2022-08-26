/*class ObjectManager{
    constructor(...objects){
        this.objs = objects;
    }
    filter(func, ...args){
        func ??= (obj, id)=>obj.id == id;
        return new ObjectManager(...this.objs.filter(object=>func(object, ...args)))
    }
}

class Thing{
    constructor(id, number, string){
        this.id = id;
        this.number = number;
        this.string = string;
    }
}

const manager = new ObjectManager(
    new Thing(1, 123, 'hello, world'),
    new Thing(2, 456, 'hi'),
    new Thing(3, 789, 'hello, ')
)

console.log(manager.filter(obj=>obj.string.match(/hello.*?/g)))*/