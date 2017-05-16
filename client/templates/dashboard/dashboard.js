import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { _ } from 'meteor/underscore';
//import Baby from 'babyparse'
import './dashboard.html';
import Papa from 'papaparse'

// Since Papa Parse has no export - this pacakge requires meteor add harrison:papa-parse to be added to project

Template.dashboardProductImporter.onRendered(function () {
  Session.setDefault('importingProducts', false);
});

Template.dashboardProductImporter.helpers({
  importingProducts: function () {
    return Session.get('importingProducts');
  },
  importSize: function () {
    return Session.get('importSize');
  }
});

Template.dashboardProductImporter.events({
  'submit #import-products-csv-form': function (event) {
    event.preventDefault();
    Papa.parse(event.target.csvImportProductsFile.files[0], {
      header: true,
      complete: function (results) {
        if (results && results.data) {
          Session.set('importSize', _.size(results.data));
          Session.set('importingProducts', true);
          Meteor.call('productImporter/importProducts', results.data, function (err, result) {
            if (err) {
              Alerts.removeSeen();
              Alerts.add('Error while importing ' + err, 'danger', {
                autoHide: true
              });
            } else {
              Alerts.removeSeen();
              Alerts.add('Products Successfully Imported', 'success', {
                autoHide: true
              });
              Session.set('importingProducts', false);
            }
          });
        }
      }
    });
  },
  'click .downloadSample': function (event) {
    event.preventDefault();
    let data = [{
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
      taxable: 'true',
  }];
    let unparse = Papa.unparse(data);
    let csvData = new Blob([unparse], {type: 'text/csv;charset=utf-8;'});
    let filename="productImportSample.csv";
    if (window.navigator.msSaveOrOpenBlob)  // IE hack; see http://msdn.microsoft.com/en-us/library/ie/hh779016.aspx
      window.navigator.msSaveBlob(csvData, filename);
    else
    {
      var a = window.document.createElement("a");
      a.href = window.URL.createObjectURL(csvData, {type: "text/plain"});
      a.download = filename;
      document.body.appendChild(a);
      a.click();  // IE: "Access is denied"; see: https://connect.microsoft.com/IE/feedback/details/797361/ie-10-treats-blob-url-as-cross-origin-and-denies-access
      document.body.removeChild(a);
    }
  }
});
