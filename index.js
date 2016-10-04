var pluginName = 'plugin-node-custom-output'; var path = require('path');
var fs = require('fs-extra'); var glob = require('glob');
var matter = require('gray-matter');

function fileExists (filePath) {
  try {
    return fs.statSync(filePath).isFile()
  } catch (err) { return false }
}
function onPatternIterate (patternlab, pattern) {
  // TODO: Move to extensions file
  if (!String.format) {
    String.format = function(format) {
      var args = Array.prototype.slice.call(arguments, 1);
      return format.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined'
          ? args[number] 
          : match
        ;
      });
    };
  }
  // END TODO

  // TODO: Move to seperate file
  var template = "<CodeSnippet Format=\"1.1.0\" xmlns=\"http://schemas.microsoft.com/VisualStudio/2005/CodeSnippet\">"
    + "\n\t<Header>"
    + "\n\t\t<Title>{0}</Title>"
    + "\n\t\t<Author>Altinn</Author>"
    + "\n\t\t<Shortcut>{1}</Shortcut>"
    + "\n\t\t<Description>{2}</Description>"
    + "\n\t\t<SnippetTypes>"
    + "\n\t\t\t<SnippetType>Expansion</SnippetType>"
    + "\n\t\t\t<SnippetType>SurroundsWith</SnippetType>"
    + "\n\t\t</SnippetTypes>"
    + "\n\t</Header>"
    + "\n\t<Snippet>"
    + "\n\t\t<Declarations>"
    + "\n\t\t</Declarations>"
    + "\n\t\t<Code Language=\"html\"><![CDATA[{3}]]></Code>"
    + "\n\t</Snippet>"
    + "\n</CodeSnippet>";
  // END TODO

  if (pattern.relPath.indexOf('probably-not-needed') === -1 &&
    pattern.relPath.indexOf('.mustache') !== -1) {
    var patternFile = fs.readFileSync(path.resolve(patternlab.config.paths.public.patterns 
      + pattern.relPath.replace(/\\/g, '-').replace('.mustache', '/') 
      + pattern.relPath.replace(/\\/g, '-')), 'utf8');

    var currentVersion = 5;
    var markdownObject = getPatternMarkdownObject(patternlab, pattern);
    if (markdownObject.data.version == currentVersion) {
      console.log('Matching version');
      updateVersionDependentPatterns(patternlab, pattern, markdownObject.data.version);
    }

    patternFile = String.format(template, "test", "test", "test", patternFile);

    fs.outputFileSync(patternlab.config.paths.public.patterns 
      + pattern.relPath.replace(/\\/g, '-').replace('.mustache', '/') 
      + 'custom-' 
      + pattern.relPath.replace(/\\/g, '-') + '.mustache', patternFile)
  }
}

function updateVersionDependentPatterns(patternlab, pattern, newVersion)  {
  for (var i = 0; i < pattern.lineageR.length; i++) {
    var currentPattern = pattern.lineageR[i];
    var lineagePathParts = currentPattern.lineagePath.split('\\');
    var lastPartParts = lineagePathParts[lineagePathParts.length - 1].split('.');
    var actualPattern = getPatternByName(patternlab, lastPartParts[0]);

    if (actualPattern) {
      var currentPatternMarkdown = getPatternMarkdownObject(patternlab, actualPattern);
      currentPatternMarkdown.data["version"] = newVersion;
      setPatternMarkdownObject(patternlab, actualPattern, currentPatternMarkdown);

      updateVersionDependentPatterns(patternlab, actualPattern, newVersion);
    } else {
      console.log('Could not find pattern with name: ' + lastPartParts[0]);
    }
  }
}

function getPatternMarkdownObject(patternlab, pattern) {
    var markdownFile = ''
    if (pattern.relPath.indexOf('.mustache') !== -1 
      && fileExists(path.resolve(patternlab.config.paths.source.patterns 
        + pattern.relPath.replace('.mustache', '.md')))) {
        markdownFile = fs.readFileSync(path.resolve(patternlab.config.paths.source.patterns 
        + pattern.relPath.replace('.mustache', '.md')), 'utf8');
    }

    return matter(markdownFile);
}

function setPatternMarkdownObject(patternlab, pattern, markdownObject) {
  return fs.outputFileSync(path.resolve(patternlab.config.paths.source.patterns + pattern.relPath.replace('.mustache', '.md')), 
                            matter.stringify(markdownObject.content.replace(/^[\r\n]+|[\r\n]+$/g, ""), markdownObject.data));
}

function getPatternByName(patternlab, patternName) {
  for (var i = 0; i < patternlab.patterns.length; i++) {
    if (patternlab.patterns[i].name === patternName) {
      return patternlab.patterns[i];
    }
  }

  return null;
}

function registerEvents (patternlab) {
  patternlab.events.on('patternlab-pattern-write-end', onPatternIterate);
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
    console.error('patternlab object not provided to plugin-init');
    process.exit(1);
  }

  var pluginConfig = getPluginFrontendConfig();
  var pluginConfigPathName = path.resolve(patternlab.config.paths.public.root,
    'patternlab-components', 'packages');

  try {
    fs.outputFileSync(pluginConfigPathName + '/' + pluginName + '.json',
      JSON.stringify(pluginConfig, null, 2));
  } catch (ex) {
    console.trace(
      'plugin-node-tab: Error occurred while writing pluginFile configuration');
    console.log(ex);
  }

  if (!patternlab.plugins) { 
    patternlab.plugins = [] 
  }

  patternlab.plugins.push(pluginConfig);
  var pluginFiles = glob.sync(__dirname + '/dist/**/*');
  if (pluginFiles && pluginFiles.length > 0) {
    var tab_frontend_snippet =
      fs.readFileSync(path.resolve(__dirname + '/src/snippet.js'), 'utf8');
    for (var i = 0; i < pluginFiles.length; i++) {
      try {
        var fileStat = fs.statSync(pluginFiles[i]);
        if (fileStat.isFile()) {
          var relativePath = path.relative(__dirname, pluginFiles[i]).replace('dist', '');
          var writePath = path.join(patternlab.config.paths.public.root,
            'patternlab-components', 'pattern-lab', pluginName, relativePath);
          var tabJSFileContents = fs.readFileSync(pluginFiles[i], 'utf8');
          tabJSFileContents = tabJSFileContents.replace('/*SNIPPETS*/', tab_frontend_snippet);

          fs.outputFileSync(writePath, tabJSFileContents);
        }
      } catch (ex) {
        console.trace(
          'plugin-node-tab: Error occurred while copying pluginFile',
          pluginFiles[i]);
        console.log(ex);
      }
    }
  }

  registerEvents(patternlab); patternlab.config[pluginName] = true;
}

module.exports = pluginInit
