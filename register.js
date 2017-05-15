import { Reaction } from '/server/api';

Reaction.registerPackage({
  label: 'Import Products from CSV',
  name: 'reaction-product-importer',
  icon: 'fa fa-cloud-upload',
  autoEnable: true,
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
      label: 'Simple Product Importer',
      description: 'Import Simple Products and Variants into Reaction from CSV',
      route: '/dashboard/product-importer',
      icon: 'fa fa-cloud-upload',
      container: 'core',
      template: 'dashboardProductImporter',
      name: 'dashboardProductImporter',
      workflow: 'productImporterWorkflow',
      priority: 2
    }
  ],
  layout: [{
    workflow: 'productImporterWorkflow',
    layout: 'coreLayout',
    theme: 'default',
    enabled: true,
    structure: {
      template: 'dashboardProductImporter',
      layoutHeader: 'goLayoutHeader',
      layoutFooter: 'goLayoutFooter',
      notFound: 'goNotFound',
      dashboardControls: 'dashboardControls',
      adminControlsFooter: 'adminControlsFooter'
    }
  }, {
    workflow: 'productImporterWorkflow',
    layout: 'getoutfittedLayout',
    theme: 'default',
    enabled: true,
    structure: {
      template: 'dashboardProductImporter',
      layoutHeader: 'goLayoutHeader',
      layoutFooter: 'goLayoutFooter',
      notFound: 'goNotFound',
      dashboardControls: 'dashboardControls',
      adminControlsFooter: 'adminControlsFooter'
    }
  }]
});

