var pluginName = 'pl-custom-output'; var path = require('path')
var fs = require('fs-extra')
var generateOutput = require('./src/generateOutput')
function onPatternIterate (patternlab, pattern) {
  generateOutput(patternlab, pattern)
}
function registerEvents (patternlab) {
  patternlab.events.on('patternlab-pattern-write-end', onPatternIterate)
}
function getPluginFrontendConfig () {
  return {
    'name': 'pattern-lab\/' + pluginName,
    'templates': [],
    'stylesheets': [],
    'javascripts': ['patternlab-components\/pattern-lab\/' + pluginName +
      '\/js\/' + pluginName + '.js'],
    'onready': 'PluginTab.init()',
    'callback': ''
  }
}
function pluginInit (patternlab) {
  if (!patternlab) {
    console.error('patternlab object not provided to plugin-init')
    process.exit(1)
  }
  var pluginConfig = getPluginFrontendConfig()
  var pluginConfigPathName = path.resolve(patternlab.config.paths.public.root,
    'patternlab-components', 'packages')
  try {
    fs.outputFileSync(pluginConfigPathName + '/' + pluginName + '.json',
      JSON.stringify(pluginConfig, null, 2))
  } catch (ex) {
    console.trace(
      'plugin-node-tab: Error occurred while writing pluginFile configuration')
    console.log(ex)
  }
  if (!patternlab.plugins) { patternlab.plugins = [] }
  patternlab.plugins.push(pluginConfig)
  if (patternlab.config[pluginName] !== undefined &&
    !patternlab.config[pluginName]) {
    registerEvents(patternlab); patternlab.config[pluginName] = true
  }
  console.log('TEST', patternlab.config.paths.source.patterns)
}
module.exports = pluginInit
