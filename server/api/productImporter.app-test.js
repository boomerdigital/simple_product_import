import {ProductImporter} from './productImporter';
import {expect} from "meteor/practicalmeteor:chai";

describe("ProductImporter", function () {


  //TODO: mock out Meteor,Reaction,Products,Packages

   let data=[
     {
     productId: '1',
     topProductType: 'simple',
     productTitle: 'Basic Reaction Product',
     pageTitle: 'This is a basic product. You can do a lot with it.',
     vendor: 'Example Manufacturer',
     handle: 'example-product',
     variantTitle: 'Basic Example Variant',
     variantType: 'variant',
     title: 'Option 1 - Red Dwarf',
     optionTitle: 'Red',
     price: '19.99',
     qty: '19',
     weight: '35',
     taxable: 'true',
     hashtags: 'Hashtags, Womens, Red',
     metafields: 'Material=Cotton | Quality=Excellent',
     description: 'Sign in as administrator to edit.\nYou can clone this product from the product grid.'
   },
     {
       productId: '1',
       productTitle: 'Basic Reaction Product',
       vendor: 'Example Manufacturer',
       variantTitle: 'Basic Example Variant',
       variantType: 'variant',
       title: 'Option 2 - Green Tomato',
       optionTitle: 'Green',
       price: '12.99',
       qty: '19',
       weight: '35',
       taxable: 'true'
     },
     {
       productId: '2',
       topProductType: 'simple',
       productTitle: 'Basic Reaction Product',
       pageTitle: 'This is another product',
       vendor: 'Example Manufacturer',
       handle: 'example-product',
       variantTitle: 'Basic Example Variant',
       variantType: 'variant',
       title: 'Option 1 - Blue Dwarf',
       optionTitle: 'Red',
       price: '19.99',
       qty: '19',
       weight: '35',
       taxable: 'true',
       hashtags: 'Hashtags, Womens, Red',
       metafields: 'Material=Cotton | Quality=Excellent',
       description: 'Sign in as administrator to edit.\nYou can clone this product from the product grid.'
     }
     ]


  it("Should group products by id", function () {
     let productsArray=ProductImporter.groupBy(data, "productId")
     size_of_group=Object.keys(productsArray).length;
     expect(size_of_group).to.equal(2);
   })
})

