import td from "testdouble";
import { expect} from 'chai';




 describe("ProductImporter", () => {
   let Meteor = td.object(["call"]);
   let Reaction = td.object(["call"]);
   let productImporter;
   let check=function(obj,obj2){ return true};
   before(function() {
     td.replace("meteor/meteor", { Meteor });
     //productImporter = require("../server/api/productImporter");
   });
   after(function() {
     td.reset();
   });

   it("passes some mocked test", function() {
     expect(1+1).to.equal(2);
   });

 });


