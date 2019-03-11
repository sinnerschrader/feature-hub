// @ts-check

const {composeEnhancers} = require('@rcgen/core');
const {format} = require('@feature-hub/rcgen/src/format');
const {gitFiles, gitIgnore, initGit} = require('@feature-hub/rcgen/src/git');
const {
  initPrettier,
  prettierConfig,
  prettierFiles,
  prettierIgnore
} = require('@feature-hub/rcgen/src/prettier');
const {
  initVscode,
  vscodeFiles,
  vscodeExtensions,
  vscodeFilesExclude,
  vscodeSearchExclude
} = require('@feature-hub/rcgen/src/vscode');

const additionalFilenames = [
  '.cache',
  'coverage',
  'lerna-debug.log',
  'lib',
  'node_modules',
  'npm-debug.log',
  'package-lock.json',
  'packages/website/build',
  'packages/website/i18n',
  'yarn-error.log'
];

exports.default = composeEnhancers([
  initGit(),
  initPrettier(),
  initVscode(),
  format(),
  gitIgnore({additionalFilenames: [...additionalFilenames, 'todo.tasks']}),

  prettierConfig({
    bracketSpacing: false,
    proseWrap: 'always',
    singleQuote: true
  }),
  prettierIgnore({
    additionalFilenames: [
      ...additionalFilenames,
      'CHANGELOG.md',
      'package.json'
    ]
  }),

  vscodeExtensions([
    'EditorConfig.EditorConfig',
    'ms-vscode.vscode-typescript-tslint-plugin',
    'unional.vscode-sort-package-json',
    'wallabyjs.wallaby-vscode'
  ]),
  vscodeFilesExclude({
    additionalFilenames: [
      ...additionalFilenames.map(filename => `**/${filename}`)
    ],
    excludedFilenamePatterns: [
      ...gitFiles,
      ...prettierFiles,
      ...vscodeFiles
    ].map(({filename}) => filename)
  }),
  vscodeSearchExclude({
    additionalFilenames: [
      ...additionalFilenames.map(filename => `**/${filename}`),
      '**/CHANGELOG.md',
      '**/yarn.lock'
    ]
  })
])({});
