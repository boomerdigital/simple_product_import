ReactionCore.registerPackage({
  label: 'Import Products from CSV',
  name: 'reaction-product-importer',
  icon: 'fa fa-cloud-upload',
  autoEnable: false,
  settings: {
    customFields: {
      topProduct: [],
      midVariant: [],
      variant: []
    }
  },
  registry: [
    {
      provides: 'dashboard',
      label: 'Product Importer',
      description: 'Import Products into Reaction from CSV',
      route: '/dashboard/product-importer',
      icon: 'fa fa-cloud-upload',
      container: 'getoutfitted',
      template: 'dashboardProductImporter',
      name: 'dashboardProductImporter',
      workflow: 'coreWorkflow',
      priority: 2
    }, {
      provides: 'settings',
      label: 'Product Importer Settings',
      route: '/dashboard/product-importer/settings',
      name: 'settingsProductImporter',
      template: 'settingsProductImporter'
    }
  ]
});
