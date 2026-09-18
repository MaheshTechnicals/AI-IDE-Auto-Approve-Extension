// Mock the vscode module for unit tests running outside the Extension Host
const Module = require('module');

const mockVscode = {
  window: {
    createOutputChannel: (name) => ({
      name,
      appendLine: () => {},
      show: () => {},
      dispose: () => {}
    }),
    createStatusBarItem: () => ({
      text: '',
      tooltip: '',
      command: '',
      show: () => {},
      dispose: () => {}
    }),
    showInformationMessage: async () => undefined,
    showWarningMessage: async () => undefined,
    showErrorMessage: async () => undefined,
    showQuickPick: async () => undefined,
    showInputBox: async () => undefined
  },
  commands: {
    executedCommands: [],
    registerCommand: () => ({ dispose: () => {} }),
    executeCommand: async (cmd, ...args) => {
      mockVscode.commands.executedCommands.push({ cmd, args });
      return undefined;
    },
    getCommands: async () => []
  },
  workspace: {
    getConfiguration: () => ({
      get: (_key, defaultVal) => defaultVal,
      update: async () => undefined
    }),
    onDidChangeConfiguration: () => ({ dispose: () => {} })
  },
  StatusBarAlignment: {
    Left: 1,
    Right: 2
  },
  ThemeColor: class {
    constructor(id) {
      this.id = id;
    }
  }
};

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === 'vscode') {
    return mockVscode;
  }
  return originalLoad.apply(this, arguments);
};
