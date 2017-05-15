import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Reaction } from '/client/api';
import { Packages } from '/lib/collections';

import './customFields.html';

function getProductImporterPackage() {
  return Packages.findOne({
    name: 'reaction-product-importer',
    shopId: Reaction.getShopId()
  });
}

Template.customFields.onRendered(function () {
  Session.setDefault('ifArray', false);
  Session.setDefault('ifObject', false);
  Session.setDefault('arrayOfObjects', false);
  Session.setDefault('objectPropertiesCount', 0);
});

Template.customFields.helpers({
  anyCustomFields: function () {
    const productImporter = getProductImporterPackage();
    return _.some(productImporter.settings.customFields, function (level) {
      return level.length > 0;
    });
  },
  customTopProducts: function () {
    const productImporter = getProductImporterPackage();
    return productImporter.settings.customFields.topProduct;
  },
  customMidVariant: function () {
    const productImporter = getProductImporterPackage();
    return productImporter.settings.customFields.midVariant;
  },
  customVariant: function () {
    const productImporter = getProductImporterPackage();
    return productImporter.settings.customFields.variant;
  },
  ifArray: function () {
    return Session.get('ifArray');
  },
  ifObject: function () {
    return Session.get('ifObject');
  },
  arrayOrObject: function () {
    return Session.get('ifArray') || Session.get('ifObject');
  },
  arrayOfObjects: function () {
    return Session.get('arrayOfObjects')
  },
  valuesOfObjects: function () {
    let objectPropertiesCount = Session.get('objectPropertiesCount');
    let valueFields = '';
    _(objectPropertiesCount).times(function (n) {
      let m = n + 1;
      let input = "<div class='form-group'>"
          + "<label for='objectPropertiesCount" + n + "'>Value Type of Property " + m + "</label>"
          + "<select required name='objectPropertiesCount" + n + "' id='objectPropertiesCount" + n + "' class='form-control'>"
          + "<option value='string'>String</option>"
          + "<option value='number'>Number</option>"
          + "<option value='boolean'>Boolean</option></select>"
        + "</div>"
      valueFields += input;
    });
    return valueFields;
  }
});

Template.customFields.events({
  'submit #customFieldsForm': function () {
    event.preventDefault();
    let customField = {};
    customField.csvColumnName = event.target.columnName.value.trim();
    customField.productFieldName = event.target.productField.value.trim();
    customField.valueType = event.target.typeSelector.value;
    const productSelector = event.target.productSelector.value;
    if (customField.valueType === 'array' || customField.valueType === 'object') {
      customField.options = {};
      customField.options.delimiter = event.target.delimiterSymbol.value;
      customField.options.typeSelector = event.target.optionTypeSelector.value;
    }
    if (customField.valueType === 'array' && event.target.optionTypeSelector.value === 'object') {
      customField.options.arrayOfObjects = {};
      customField.options.arrayOfObjects.propertyCount = parseInt(event.target.objectPropertiesCount.value, 10);
      customField.options.arrayOfObjects.delimiter = event.target.objectPropertiesDelimiter.value;
      _(customField.options.arrayOfObjects.propertyCount).times(function (n) {

        customField.options.arrayOfObjects[n] = event.target['objectPropertiesCount' + n].value;
      })
    }

    let columnNameWhiteSpace = customField.csvColumnName.search(/\s/g);
    let productFieldNameWhiteSpace = customField.productFieldName.search(/\s/g);
    let noWhiteSpace = columnNameWhiteSpace + productFieldNameWhiteSpace === -2;
    if (noWhiteSpace) {
      Meteor.call('productImporter/addCustomField', productSelector, customField);
    } else {
      Alerts.removeSeen();
      Alerts.add('No Spaces are allow in ColumnName or ProductFieldName', 'danger', {
        autoHide: true
      });
    }
    event.target.columnName.value = '';
    event.target.productField.value = '';
    Session.set('ifArray', false);
    Session.set('ifObject', false);
    Session.set('arrayOfObjects', false);
    Session.set('objectPropertiesCount', 0);
  },
  'change form #typeSelector': function () {
    event.preventDefault();
    let selectedType = event.target.value;
    if (selectedType === 'array') {
      Session.set('ifArray', true);
      Session.set('ifObject', false);
    } else if (selectedType === 'object') {
      Session.set('ifArray', false);
      Session.set('ifObject', true);
    } else {
      Session.set('ifArray', false);
      Session.set('ifObject', false);
    }
  },
  'change form #optionTypeSelector': function () {
    const selectedOption = event.target.value;
    if (selectedOption === 'object') {
      Session.set('arrayOfObjects', true)
    } else {
      Session.set('arrayOfObjects', false)
    }
  },
  'click .remove': function (event) {
    event.preventDefault();
    let customRemoval = {};
    customRemoval.level = event.currentTarget.dataset.level;
    customRemoval.csvColumnName = event.currentTarget.dataset.csvColumnName;
    customRemoval.productFieldName = event.currentTarget.dataset.productFieldName;
    customRemoval.valueType = event.currentTarget.dataset.valueType;
    if (Object.keys(customRemoval).length === 4) {
      Meteor.call('productImport/removeCustomField', customRemoval);
    }
  },
  'change form #objectPropertiesCount': function () {
    Session.set('objectPropertiesCount', parseInt(event.target.value, 10));
  }
});
