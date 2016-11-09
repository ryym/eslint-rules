const eslint = require("eslint")
const path = require('path')
const fs = require('fs')

function extractRules(rules) {
  return Object.keys(rules).map(name => {
    return normalizeRule(name, rules[name])
  })
}

function normalizeRule(name, setting) {
  const library = detectLibraryName(name)
  const rule = {
    name,
    library,
    documentURL: inferRuleURL(library, name)
  }

  if (! Array.isArray(setting)) {
    rule.severity = normalizeSeverity(setting)
    rule.options = []
  }
  else {
    rule.severity = normalizeSeverity(setting[0])
    rule.options = setting.slice(1)
  }

  return rule
}

function detectLibraryName(ruleName) {
  const pos = ruleName.indexOf('/')
  if (pos === -1) {
    return 'eslint'
  }
  return ruleName.slice(0, pos)
}

const severityStrings = {
  "off": 0,
  "warn": 1,
  "error": 2
}
function normalizeSeverity(severity) {
  const num = (typeof severity === 'number')
    ? severity
    : severityStrings[severity]

  return num
}

function inferRuleURL(library, fullRuleName) {
  if (library === 'eslint') {
    return `http://eslint.org/docs/rules/${fullRuleName}`
  }
  const pluginURL = detectPluginRepoURL(library)
  if (pluginURL) {
    const rule = fullRuleName.slice(fullRuleName.indexOf('/') + 1)
    return `${pluginURL}/blob/master/docs/rules/${rule}.md`
  }
}

function detectPluginRepoURL(pluginName) {
  const jsonPath = findPackageJson(`eslint-plugin-${pluginName}`)
  const json = JSON.parse(fs.readFileSync(jsonPath))
  if (json.repository && json.repository.url) {
    return json.repository.url
  }
}

function findPackageJson(moduleName) {
  let dir = path.dirname(require.resolve(moduleName))
  while (! fs.existsSync(`${dir}/package.json`)) {
    dir = path.dirname(dir)
  }
  return `${dir}/package.json`
}

module.exports = function execute(filePath, cliConfig) {
  const cli = new eslint.CLIEngine(cliConfig)
  const config = cli.getConfigForFile('_.js')
  const rules = extractRules(config.rules)
  return rules
}
