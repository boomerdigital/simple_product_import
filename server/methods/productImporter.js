import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Packages } from '/lib/collections';
import { Reaction } from '/server/api';
import { _ } from 'meteor/underscore';

import { ProductImporter } from '../api';

Meteor.methods({
  'productImporter/importProducts': function (productsList) {
    console.log(productsList);
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
  },
  'productImporter/addCustomField': function (productSelector, customField) {
    check(productSelector, String);
    check(customField, Object);
    let variantLevelToBeUpdated = 'settings.customFields.' + productSelector;
    let updateObj = {};
    updateObj[variantLevelToBeUpdated] = customField;
    Packages.update({
      name: 'reaction-product-importer',
      shopId: Reaction.getShopId()
    }, {
      $addToSet: updateObj
    });
  },
  'productImport/removeCustomField': function (removingField) {
    check(removingField, {
      level: String,
      csvColumnName: String,
      productFieldName: String,
      valueType: String
    });
    let data = Packages.findOne({
      name: 'reaction-product-importer',
      shopId: Reaction.getShopId()
    });
    if (data) {
      let customFields = data.settings.customFields;
      _.each(customFields[removingField.level], function (field, index) {
        let csvColumnName = field.csvColumnName === removingField.csvColumnName;
        let productFieldName = field.productFieldName === removingField.productFieldName;
        let valueType = field.valueType === removingField.valueType;
        if (csvColumnName && productFieldName && valueType && index !== -1) {
          customFields[removingField.level].splice(index, 1);
        }
      });
      Packages.update({_id: data._id}, {
        $set: {
          'settings.customFields': customFields
        }
      });
    } else {
      throw new Error('403 Cannot find package.');
    }
  }
});

