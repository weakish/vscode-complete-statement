import {after, afterEach, before, beforeEach, describe, it} from 'mocha';
import * as assert from 'assert';
import * as vscode from 'vscode';
import {EOL} from 'node:os';

describe('VSCode complete statement extension test suite', () => {
  let editor: vscode.TextEditor;

  before(async () => {
    const doc: vscode.TextDocument = await vscode.workspace.openTextDocument({
      content: '',
      language: 'plaintext'
    });

    editor = await vscode.window.showTextDocument(doc);

    if (!editor) {
      assert.fail("Editor is not available");
    }
  });

  after(async () => {
  });

  beforeEach(async () => {
  });

  afterEach(async () => {
    await vscode.commands.executeCommand('editor.action.selectAll');
    await vscode.commands.executeCommand('deleteLeft');
  });

  it('it can handle if', async () => {
    await editor.edit(editBuilder => {
      editBuilder.insert(new vscode.Position(0, 0), 'if ()');
    });

    await vscode.commands.executeCommand('extension.complete-statement');

    let text = editor.document.getText();

    assert.equal(text, `if () {${EOL}    ${EOL}}`, `not expected ${text}`);
  });
})
