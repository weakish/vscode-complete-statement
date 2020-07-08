import * as vscode from 'vscode'


export function activate(extensionContext: vscode.ExtensionContext) {

    console.log('"complete-statement" is activated.')

    const disposable: vscode.Disposable =
            vscode.commands.registerTextEditorCommand(
                    'extension.complete-statement',
                    (textEditor, textEditorEdit) =>
                        { complete_statement(textEditor, textEditorEdit) }
            )
    extensionContext.subscriptions.push(disposable)
}
export function deactivate() {
    console.log('"complete-statement" is deactivated.')
}

function complete_statement(textEditor: vscode.TextEditor,
                            textEditorEdit: vscode.TextEditorEdit
                           ): void
{
    let current_line_number: number = textEditor.selection.start.line
    let current_line: vscode.TextLine = textEditor.document.lineAt(current_line_number)
    
    // Get indentation level here for use with either
    // new lines after semicolon or new block of code.
    // Assuming use spaces to indent.
    const tab_stop: number = vscode.workspace.getConfiguration('editor').get('tabSize', 4)
    let indent_level: number = 0
    if (current_line.text.startsWith(' ')) // indented
    {
        const indent_position: number =
                current_line.text.lastIndexOf(" ".repeat(tab_stop))
        indent_level = indent_position / tab_stop + 1
    }
    const indent_space_count: number = tab_stop * (indent_level + 1)
    const indent_spaces: string = " ".repeat(indent_space_count)
    const less_indent_spaces: string = " ".repeat(tab_stop * indent_level)
    const is_at_end = (): boolean => {
        const editor = vscode.window.activeTextEditor
        if (editor) {
            let position: vscode.Position = editor.selection.active
            return position.character == current_line.range.end.character
        } else {
            return false
        }
    }
    
    if (current_line.text.trim() === '}')
    {
        vscode.commands.executeCommand('cursorMove', {'to': 'up'})
        vscode.commands.executeCommand('cursorMove', {'to': 'wrappedLineEnd'})
    }
    else if (looks_like_complex_structure(current_line))
    {
        if (current_line.text.endsWith('{'))
        {
            vscode.commands.executeCommand('cursorMove', {'to': 'down'})
            vscode.commands.executeCommand('cursorMove', {'to': 'wrappedLineEnd'})
        }
        else
        {
            let braces: string
            const allman: boolean =
                    vscode.workspace.getConfiguration('complete-statement').get('allman', false)
            if (allman)
            {
                braces = `\n${less_indent_spaces}{\n${indent_spaces}` +
                        `\n${less_indent_spaces}}`
                textEditorEdit.insert(current_line.range.end, braces)
            }
            else
            {
                braces = `{\n${indent_spaces}\n${less_indent_spaces}}`
                if (current_line.text.endsWith(" ")) // avoid duplicated spaces
                {
                    // pass
                }
                else
                {
                    braces = ` ${braces}`
                }
                textEditorEdit.insert(current_line.range.end, braces)
            }
            
            // After completion, vscode will move the cursor to the end of the added text
            // if the cursor is currently at the end of the line, otherwise the cursor
            // stays on the current line.
            // Figure out is_at_end here. 
            // Move the cursor into the newly created block.
            if (is_at_end()) {
                vscode.commands.executeCommand('cursorMove', {'to': 'up'})
            }
            else {
                vscode.commands.executeCommand('cursorMove', {'to': 'down'})
            }
            vscode.commands.executeCommand('cursorMove', {'to': 'wrappedLineEnd'})
        }
    }
    else
    {
        if (current_line.text.trim() !== '' && !current_line.text.endsWith(';')) {
            textEditorEdit.insert(current_line.range.end, ';')
        }

        textEditorEdit.insert(current_line.range.end, '\n' + less_indent_spaces)
        // If the cursor is currently at the end of the line,
        // vscode will move it to the end of the next line after insertion.
        // Otherwise we will move the cursor ourselves.
        if(!is_at_end()) {
            vscode.commands.executeCommand('cursorMove', {'to': 'down'})
            vscode.commands.executeCommand('cursorMove', {'to': 'wrappedLineEnd'})
        }
    }
}


function looks_like_complex_structure(line: vscode.TextLine): boolean
{
    const trimmed: string = line.text.trim()
    // class and object
    if (trimmed.startsWith('class ') ||
        trimmed.startsWith('interface ') ||
        trimmed.startsWith('object '))
    {
        return true
    }
    // if else
    else if (trimmed.startsWith('if (') ||
             trimmed.startsWith('if(') ||
             trimmed.startsWith('} else') ||
             trimmed.startsWith('else'))
    {
        return true
    }
    // switch
    else if (trimmed.startsWith('switch (') ||
             trimmed.startsWith('switch('))
    {
        return true
    }
    // loop
    else if (trimmed.startsWith('for (') ||
             trimmed.startsWith('for(') ||
             trimmed.startsWith('while (') ||
             trimmed.startsWith('while(') ||
             trimmed.startsWith('do') ||
             trimmed.startsWith('loop'))
    {
        return true
    }
    // function
    else if (
             trimmed.startsWith('function ') || // javascript
             trimmed.startsWith('func ') || // swift
             trimmed.startsWith('fun ') || // kotlin
             trimmed.startsWith('def ') || // scala
             trimmed.startsWith('fn ') || // rust
             // Regexp is expensive, so we test it after other structures.
             /^\w+\s\w+\s?\(/.test(trimmed)) // c, java, ceylon
    {
        return true
    }
    else
    {
        return false
    }
}
