var pluginName = 'pl-custom-output'; var path = require('path')
var fs = require('fs-extra'); var glob = require('glob')
function onPatternIterate (patternlab, pattern) {
  console.log('TEST...', patternlab.config.paths.source.patterns)


  // var _path = require('path')
  //
  // var MP = require('./node_modules/patternlab-node/core/lib/markdown_parser')
  // var markdown_parser = new MP()
  // // Custom pattern output
  // gulp.task('cpo', function () {
  //   return gulp.src('./public/patterns/**/*')
  //   .pipe(gulp_rename(function (path) {
  //     if (path.dirname !== '.') {
  //       var markdownFileName =
  //       _path.resolve('source/_patterns/00-atomer/01-input/01-avkrysningsboks.md')
  //       var markdownFileContents = fs.readFileSync(markdownFileName, 'utf8')
  //       var markdownObject = markdown_parser.parse(markdownFileContents)
  //       path.extname += markdownObject.version + path.extname
  //     }
  //   }))
  //   .pipe(gulp.dest('./public/patterns'))
  // })

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
        console.trace('plugin-node-tab: Error occurred while copying pluginFile',
          pluginFiles[i])
        console.log(ex)
      }
    }
  }
  if (patternlab.config[pluginName] !== undefined &&
    !patternlab.config[pluginName]) {
    registerEvents(patternlab); patternlab.config[pluginName] = true
  }
}
module.exports = pluginInit
