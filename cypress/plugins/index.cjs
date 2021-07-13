/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.cjs can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

import installLogsPrinter from "cypress-terminal-report/src/installLogsPrinter";

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
export default function pluginConfig (on, config) {
	installLogsPrinter(on);
	// `on` is used to hook into various events Cypress emits
	// `config` is the resolved Cypress config
}
