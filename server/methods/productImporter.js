import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Packages } from '/lib/collections';
import { Reaction } from '/server/api';
import { _ } from 'meteor/underscore';

import { ProductImporter } from '../api';

Meteor.methods({
  'productImporter/importProducts': function (productsList) {
    check(productsList, [Object]);
    //  group each Product by Product ID
    let productsById = ProductImporter.groupBy(productsList, 'productId');
    _.each(productsById, function (product) {
      let productId = ProductImporter.createTopLevelProduct(product);
      let ancestors = [productId];
      // group each variant by variant title
      let variantGroups = ProductImporter.groupBy(product, 'variantTitle');
      _.each(variantGroups, function (variantGroup) {
        let variantGroupId = ProductImporter.createMidLevelVariant(variantGroup, ancestors);
        let variantAncestors = ancestors.concat([variantGroupId]);
        // create each sub variant
        _.each(variantGroup, function (variant) {
          ProductImporter.createVariant(variant, variantAncestors);
        });
      });
    });
    return true;
  }
});

