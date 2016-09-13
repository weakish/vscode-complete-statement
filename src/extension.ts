'use strict';
import { ExtensionContext } from 'vscode';
import { Disposable } from 'vscode';
import { TextEditor } from 'vscode';
import { TextEditorEdit } from 'vscode';
import { TextLine } from 'vscode';
import { Selection } from 'vscode';
import { Position } from 'vscode';
import { commands } from 'vscode';
import { workspace } from 'vscode';
import getConfiguration = workspace.getConfiguration;


export function activate(extensionContext: ExtensionContext) {

    console.log('"complete-statement" is activated.');

    const disposable: Disposable =
            commands.registerTextEditorCommand(
                    'extension.complete-statement',
                    (textEditor, textEditorEdit) =>
                        complete_statement(textEditor, textEditorEdit)
            );
    extensionContext.subscriptions.push(disposable);
}
export function deactivate() {
    console.log('"complete-statement" is deactivated.');
}

function complete_statement(
        textEditor: TextEditor,
        textEditorEdit: TextEditorEdit
        
        ): void　{
    let current_line_number: number = textEditor.selection.start.line;
    let current_line: TextLine = textEditor.document.lineAt(current_line_number);
    if (naive_complex_statement_detector(current_line)) {
        let braces: string;
        let indent_level: number;
        // Assuming use spaces to indent.
        const configuration = getConfiguration("editor");
        const tab_stop: number = configuration.get("tabSize", 4);
        if  (current_line.text.startsWith(" ")) { // indented
            indent_level = current_line.text.lastIndexOf(" ".repeat(tab_stop)) / tab_stop + 1;
        } else {
            indent_level = 0;
        }
        const indent_space_count: number = tab_stop * (indent_level + 1)
        const indent_spaces: string = " ".repeat(indent_space_count);
        const less_indent_spaces: string = " ".repeat(tab_stop * indent_level);
        const _brances: string = `{\n${indent_spaces}\n${less_indent_spaces}}`
        if (current_line.text.endsWith(" ")) { // avoid duplicated spaces
            braces = _brances;
        } else {
            braces = ` ${_brances}`;
        }
        insert_braces(braces, current_line, textEditorEdit);
        // Unlike IntelliJ, it does not go to the start (`^` in vim) of new line.
        // You have to press `down` arrow key.
        // Why?
        // Inserting a multi-line string seems confusing vscode.
        // If we create a new selection of current line and its `range.end`,
        // the cursor will be at the end of inserted string, a.k.a. `}`.
        // If we try to go backward,
        // creating a new selection of current line and its `range.end - n`,
        // then the `range.end` will still be the original end (before insert),
        // thus it will go backward n characters from the original end.
        // The position within the inserted string will be unreachable.    
        //
        // See [#11841](https://github.com/Microsoft/vscode/issues/11841)
        current_line = textEditor.document.lineAt(current_line_number);
        textEditor.selection = goto_line_end(current_line, textEditor, 2)
    } else {
        insert_semicolon_at_line_end(current_line, textEditorEdit);
        textEditor.selection = goto_line_end(current_line, textEditor);
    }    
}

function naive_complex_statement_detector(line: TextLine) {
    if (line.text.includes("function ")) { // function
        return true;
    } else if ( // if else
            line.text.includes("if (") ||
            line.text.includes("if(") ||
            line.text.includes("} else") ||
            line.text.includes("else ")
            ) {
        return true;
    } else if ( // switch
            line.text.includes("switch (") ||
            line.text.includes("switch(")
            ) {
        return true;
    } else if ( // loop
            line.text.includes("for (") ||
            line.text.includes("for(") ||
            line.text.includes("while (") ||
            line.text.includes("while(") ||
            line.text.endsWith("do") || // `endsWith` to avoid too many false positive.
            line.text.endsWith("do ")
            ) {
        return true;
    } else {
        return false;
    }
}

function insert_semicolon_at_line_end(
        line: TextLine,
        textEditorEdit: TextEditorEdit
        ): void {
    if (!line.text.endsWith(";")) {
        textEditorEdit.insert(line.range.end, ";");
    }
}

function insert_braces(
        braces: string,
        line: TextLine,
        textEditorEdit: TextEditorEdit
        ): void {
    if (!line.text.endsWith("{")) {
        textEditorEdit.insert(line.range.end, braces);
    }
}

function goto_line_end(
        line: TextLine,
        textEditor: TextEditor,
        offset: number = 0): Selection {
    const line_number = line.lineNumber;
    const end: number = line.range.end.character - offset;
    return new Selection(line_number, end, line_number, end);
}