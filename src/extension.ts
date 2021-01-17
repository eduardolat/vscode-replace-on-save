// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

interface Rule {
  search: string;
  replace: string;
}

interface Replacement {
  languageIdentifiers: string[];
  rules: Rule[];
}

function doReplacements(textLine: string, replacements: Replacement[], languageId: string): string {
  if (textLine.length < 1) {
    // Return if is a blank line
    return textLine;
  }

  // Determine the rules for the languagueID
  let rules: Rule[] = [];
  replacements.forEach(replacement => {
    if (replacement.languageIdentifiers.includes(languageId)) {
      replacement.rules.forEach(rule => {
        rules.push(rule);
      });
    }
  });

  let finalTextLine = textLine;

  rules.forEach(rule => {
    finalTextLine = finalTextLine.replace(new RegExp(rule.search, 'g'), rule.replace);
  });

  return finalTextLine;
}

export function activate() {
  console.log('Congratulations, your extension "Replace On Save" is now active!');

  vscode.workspace.onWillSaveTextDocument((documentWillSave: vscode.TextDocumentWillSaveEvent) => {
    // Get configurations
    const enabled: boolean =
      vscode.workspace.getConfiguration('replace-on-save').get('enabled') || false;

    const replacements: Replacement[] =
      vscode.workspace.getConfiguration('replace-on-save').get('replacements') || [];

    // Load all language identifiers in the configuration file
    let allLanguageIdentifiers: string[] = [];
    replacements.forEach(replacement => {
      replacement.languageIdentifiers.forEach(identifier => {
        allLanguageIdentifiers.push(identifier);
      });
    });

    const document = documentWillSave.document;

    if (enabled && allLanguageIdentifiers.includes(document.languageId)) {
      //
      const lastLineLength = document.lineAt(document.lineCount - 1).text.length;

      documentWillSave.waitUntil(
        new Promise(resolve => {
          let oldText: string = '';
          let newText: string = '';

          for (let lineNo = 0; lineNo < document.lineCount; lineNo++) {
            if (lineNo > 0) {
              oldText += '\n';
              newText += '\n';
            }
            newText += doReplacements(
              document.lineAt(lineNo).text,
              replacements,
              document.languageId,
            );
            oldText += document.lineAt(lineNo).text;
          }

          // Prevent no necesary changes
          if (newText !== oldText) {
            resolve([
              vscode.TextEdit.insert(new vscode.Position(0, 0), newText),
              vscode.TextEdit.delete(
                new vscode.Range(
                  new vscode.Position(0, 0),
                  new vscode.Position(document.lineCount - 1, lastLineLength),
                ),
              ),
            ]);
          }
          resolve([]);
        }),
      );
    }
  });
}

// this method is called when your extension is deactivated
export function deactivate() {}
