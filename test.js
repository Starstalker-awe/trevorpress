import assert from 'assert/strict';
import app from './server.js';

let ffunc;

console.log(app._router.stack)

describe("Full server test", _=>{
    describe("Routes respond", finish=>{
        it("Main routes", done=>{
            assert.equal(1, 1);

            done();
        });

        finish();
    })
    it("Thing", done=>{
        assert.equal(1, 1);

        done();
    })
})