import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Products, Packages } from '/lib/collections';
import { Reaction, Logger } from '/server/api';
import { _ } from 'meteor/underscore';

export const ProductImporter = {};
ProductImporter.existingProduct = function (product, type = 'variant') {
  check(product, Object);
  check(type, String);
  if (type !== 'variant') {
    return Products.findOne({
      title: product.title,
      vendor: product.vendor,
      ancestors: product.ancestors,
      type: type,
      handle: product.handle
    });
  }
  return Products.findOne({
    title: product.title,
    ancestors: product.ancestors,
    type: type
  });
};

//Not supported
ProductImporter.anyCustomFields = function (level) {
  return false;
};
ProductImporter.customFields = function (level) {
  check(level, String);
  let validLevels = ['topProduct', 'midVariant', 'variant'];

  if (!_.contains(validLevels, level)) {
    Logger.warn('Customized Import does not match level');
    return false;
  }
  let productImporter = Packages.findOne({
    name: 'simple-product-importer',
    shopId: Reaction.getShopId()
  });
  if (productImporter && productImporter.settings && productImporter.settings.customFields) {
    return productImporter.settings.customFields[level];
  }
};

ProductImporter.groupBy = function (productList, groupIdentifier) {
  check(productList, [Object]);
  check(groupIdentifier, String);
  return _.groupBy(productList, function (product) {
    return product[groupIdentifier];
  });
};

ProductImporter.parseBasicType = function (value, valueType = 'string') {
  check(value, String);
  check(valueType, String);
  switch (valueType) {
  case 'number':
    return parseFloat(value, 10);
  case 'boolean':
    return JSON.parse(value.toLowerCase());
  default:
    return value;
  }
};

ProductImporter.parseByType = function (value, customField) {
  check(value, String);
  check(customField, Object);
  switch (customField.valueType) {
  case 'number':
    return parseFloat(value, 10);
  case 'boolean':
    return JSON.parse(value.toLowerCase());
  case 'array':
    const arrayValues = value.split(customField.options.delimiter);
    if (customField.options.typeSelector === 'object') {
      let arrayOfObjects = [];
      _.each(arrayValues, function (stringObs) {
        let object = {};
        let arrayOfKeyValues = stringObs.split(customField.options.arrayOfObjects.delimiter);
        _.each(arrayOfKeyValues, function (objectValue, index) {
          let keyValues = objectValue.split('=');
          let key = keyValues[0].trim();
          let v = keyValues[1].trim();
          object[key] = ProductImporter.parseBasicType(v, customField.options.arrayOfObjects[index]);
        })
        arrayOfObjects.push(object);
      });
      return arrayOfObjects;
    } else {
      const cleaned = _.map(arrayValues, function (arrayValue) {
        return ProductImporter.parseBasicType(arrayValue.trim(), customField.options.typeSelector);
      });
      return cleaned;
    }
  case 'object':
    const objectValues = value.split(customField.options.delimiter);
    let customObject = {};
    _.each(objectValues, function (objectValue) {
      let keyValues = objectValue.split('=');
      let key = keyValues[0].trim();
      let v = keyValues[1].trim();
      customObject[key] = ProductImporter.parseBasicType(v, customField.options.typeSelector);
    });
    return customObject;
  default:
    return value;
  }
};

ProductImporter.createTopLevelProduct = function (product) {
  check(product, [Object]);
  let baseProduct = product[0];
  let sameProduct = _.every(product, function (item) {
    const result = baseProduct.productTitle === item.productTitle;
    return result;
  });
  if (!sameProduct) {
    Logger.warn('One or more Products with productId ' + baseProduct.productId + ' have different product titles');
  }
  let maxPricedProduct = _.max(product, function (item) {
    return parseInt(item.price, 10);
  });
  let maxPrice = maxPricedProduct.price;
  let minPricedProduct = _.min(product, function (item) {
    return parseInt(item.price, 10);
  });
  let minPrice = minPricedProduct.price;
  let prod = {};
  prod.ancestors = [];
  prod.shopId = Reaction.getShopId();
  prod.title = baseProduct.productTitle;
  prod.vendor = baseProduct.vendor;
  prod.pageTitle = baseProduct.pageTitle;
  prod.handle = baseProduct.handle.toLowerCase().trim();
  prod.handle = prod.handle.replace(/\s/, '-');
  prod.isVisible = false;
  prod.description = baseProduct.description;
  prod.type = baseProduct.topProductType || 'simple';
  prod.price = {};
  prod.price.max = maxPrice;
  prod.price.min = minPrice;
  if (maxPrice > minPrice) {
    prod.price.range = minPrice + ' - ' + maxPrice;
  } else {
    prod.price.range = minPrice;
  }

  if (baseProduct.metafields) {
    let delimited = baseProduct.metafields.split('|');
    prod.metafields = [];
    _.each(delimited, function (objectValue) {
      let metafield = {};
      let keyValues = objectValue.split('=');
      let key = keyValues[0].trim();
      let v = keyValues[1].trim();
      metafield.key = key;
      metafield.value = v;
      prod.metafields.push(metafield);
    });
  }
  if (this.anyCustomFields('topProduct')) {
    let customFields = this.customFields('topProduct');
    _.each(customFields, function (customField) {
      let result = ProductImporter.parseByType(baseProduct[customField.csvColumnName], customField);
      prod[customField.productFieldName] = result;
    });
  }
  let existingProduct = this.existingProduct(prod, prod.type);
  if (existingProduct) {
    Logger.warn('Found product = ' + existingProduct._id);
    Logger.warn(existingProduct.vendor + ' ' + existingProduct.title + ' has already been added.');
    return existingProduct._id;
  }
  let reactionProductId = Products.insert(prod, {selector: {type: prod.type}});
  let hashtags = baseProduct.hashtags.split(',');
  _.each(hashtags, function (hashtag) {
    Meteor.call('products/updateProductTags', reactionProductId, hashtag.trim(), null);
  });
  Logger.info(prod.vendor + ' ' + prod.title + ' was successfully added to Products.');
  return reactionProductId;
};

ProductImporter.createMidLevelVariant = function (variant, ancestors) {
  check(variant, [Object]);
  check(ancestors, [String]);
  let baseVariant = variant[0];
  let sameVariant = _.every(variant, function (item) {
    return baseVariant.variantTitle === item.variantTitle;
  });
  if (!sameVariant) {
    Logger.warn('One or more Products with variantTitle ' + baseVariant.variantTitle + ' have different variant titles');
  }
  let inventory = _.reduce(variant, function (sum, item) {
    return sum + parseInt(item.qty, 10);
  }, 0);
  let prod = {};
  prod.ancestors = ancestors;
  prod.isVisible = false;
  prod.type = baseVariant.variantType || 'variant';
  prod.title = baseVariant.variantTitle;
  prod.price = baseVariant.price;
  prod.inventoryQuantity = inventory;
  prod.weight = parseInt(baseVariant.weight, 10);
  prod.shopId = Reaction.getShopId();
  prod.taxable = baseVariant.taxable.toLowerCase() === 'true';
  if (this.anyCustomFields('midVariant')) {
    let customFields = this.customFields('midVariant');
    _.each(customFields, function (customField) {
      let result = ProductImporter.parseByType(baseVariant[customField.csvColumnName], customField);
      prod[customField.productFieldName] = result;
    });
  }
  let existingVariant = this.existingProduct(prod, prod.type);
  if (existingVariant) {
    Logger.warn('Found product = ' + existingVariant._id);
    Logger.warn(existingVariant.title + ' has already been added.');
    return existingVariant._id;
  }
  let reactionVariantId = Products.insert(prod, {selector: {type: prod.type}});
  Logger.info(prod.title + ' was successfully added to Products as a variant.');
  return reactionVariantId;
};

ProductImporter.createVariant = function (variant, ancestors) {
  check(variant, Object);
  check(ancestors, [String]);
  let prod = {};
  prod.ancestors = ancestors;
  prod.isVisible = false;
  prod.type = variant.variantType || 'variant';
  prod.title = variant.title;
  prod.optionTitle = variant.optionTitle;
  prod.price = variant.price;
  prod.inventoryQuantity = parseInt(variant.qty, 10);
  prod.weight = parseInt(variant.weight, 10);
  prod.shopId = Reaction.getShopId();
  prod.taxable = variant.taxable.toLowerCase() === 'true';
  if (this.anyCustomFields('variant')) {
    let customFields = this.customFields('variant');
    _.each(customFields, function (customField) {
      let result = ProductImporter.parseByType(variant[customField.csvColumnName], customField);
      prod[customField.productFieldName] = result;
    });
  }
  let existingVariant = this.existingProduct(prod, prod.type);
  if (existingVariant) {
    Logger.warn('Found product = ' + existingVariant._id);
    Logger.warn(existingVariant.title + ' has already been added.');
    return existingVariant._id;
  }
  let reactionVariantId = Products.insert(prod, {selector: {type: prod.type}});
  Logger.info(prod.title + ' was successfully added to Products as a variant.');
  return reactionVariantId;
};
