var pluginName = 'plugin-node-custom-output'; var path = require('path')
var fs = require('fs-extra'); var glob = require('glob')
var MP = require('../patternlab-node/core/lib/markdown_parser')
var markdown_parser = new MP()
function onPatternIterate (patternlab, pattern) {
  console.log('FØR', patternlab.config.paths.source.patterns + pattern.relPath)
  if (pattern.relPath.indexOf('.md') !== -1) {
    console.log('ETTER', patternlab.config.paths.source.patterns + pattern.relPath)
    var markdownFile = fs.readFileSync(
      path.resolve(patternlab.config.paths.source.patterns +
        pattern.relPath), 'utf8')
  }
  if (pattern.relPath.indexOf('probably-not-needed') === -1 &&
    pattern.relPath.indexOf('.mustache') !== -1) {
    var patternFile = fs.readFileSync(
      path.resolve(
        patternlab.config.paths.public.patterns +
        pattern.relPath.replace(/\//g, '-').replace('.mustache', '/') +
        pattern.relPath.replace(/\//g, '-')), 'utf8')
    var markdownObject = markdown_parser.parse(markdownFile)
    patternFile = markdownObject.prepend + patternFile + markdownObject.append
    fs.outputFileSync(patternlab.config.paths.public.patterns +
        pattern.relPath.replace(/\//g, '-').replace('.mustache', '/') +
        'custom-' + pattern.relPath.replace(/\//g, '-') + '-v' +
        markdownObject.version + '.mustache',
      patternFile)
  }
}
function registerEvents (patternlab) {
  patternlab.events.on('patternlab-pattern-write-end', onPatternIterate)
}
function getPluginFrontendConfig () {
  return {
    'name': 'pattern-lab\/' + pluginName, 'templates': [],
    'stylesheets': [],
    'javascripts': ['patternlab-components\/pattern-lab\/' + pluginName +
      '\/js\/' + pluginName + '.js'],
    'onready': 'PluginCustomOutput.init()', 'callback': ''
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
  var pluginFiles = glob.sync(__dirname + '/dist/**/*')
  if (pluginFiles && pluginFiles.length > 0) {
    let tab_frontend_snippet =
      fs.readFileSync(path.resolve(__dirname + '/src/snippet.js'), 'utf8')
    for (let i = 0; i < pluginFiles.length; i++) {
      try {
        var fileStat = fs.statSync(pluginFiles[i])
        if (fileStat.isFile()) {
          var relativePath = path.relative(__dirname, pluginFiles[i])
            .replace('dist', '')
          var writePath = path.join(patternlab.config.paths.public.root,
            'patternlab-components', 'pattern-lab', pluginName, relativePath)
          let tabJSFileContents = fs.readFileSync(pluginFiles[i], 'utf8')
          tabJSFileContents = tabJSFileContents
            .replace('/*SNIPPETS*/', tab_frontend_snippet)
          fs.outputFileSync(writePath, tabJSFileContents)
        }
      } catch (ex) {
        console.trace(
          'plugin-node-tab: Error occurred while copying pluginFile',
          pluginFiles[i])
        console.log(ex)
      }
    }
  }
  // if (patternlab.config[pluginName] !== undefined &&
    // !patternlab.config[pluginName]) {
  registerEvents(patternlab); patternlab.config[pluginName] = true
  // }
}
module.exports = pluginInit
