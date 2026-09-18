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
    showInputBox: async () => undefined,
    setStatusBarMessage: () => ({ dispose: () => {} }),
    withProgress: async (_options, task) => {
      return task(
        { report: () => {} },
        { isCancellationRequested: false, onCancellationRequested: () => ({ dispose: () => {} }) }
      );
    }
  },
  extensions: {
    getExtension: () => undefined
  },
  env: {
    openExternal: async () => true
  },
  Uri: {
    file: (p) => ({ fsPath: p, scheme: 'file' }),
    parse: (u) => ({ toString: () => u, scheme: 'https' })
  },
  ProgressLocation: {
    SourceControl: 1,
    Window: 10,
    Notification: 15
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
    getConfiguration: (section) => ({
      get: (_key, defaultVal) => defaultVal,
      inspect: () => undefined,
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
