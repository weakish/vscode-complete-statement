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
            // Assuming use spaces to indent.
            const tab_stop: number = vscode.workspace.getConfiguration('editor').get('tabSize', 4)
            let indent_level: number
            if (current_line.text.startsWith(' ')) // indented
            {
                const indent_position: number =
                        current_line.text.lastIndexOf(" ".repeat(tab_stop))
                indent_level = indent_position / tab_stop + 1
            }
            else
            {
                indent_level = 0
            }
            const indent_space_count: number = tab_stop * (indent_level + 1)
            const indent_spaces: string = " ".repeat(indent_space_count)
            const less_indent_spaces: string = " ".repeat(tab_stop * indent_level)
            let braces: string
            const allman: boolean =
                    vscode.workspace.getConfiguration('complete-statement').get('allman', false)
            if (allman)
            {
                braces = `\n${less_indent_spaces}{\n${indent_spaces}` +
                        `\n${less_indent_spaces}}`
                textEditorEdit.insert(current_line.range.end, braces)
                vscode.commands.executeCommand('cursorMove', {'to': 'wrappedLineEnd'})
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
                vscode.commands.executeCommand('cursorMove', {'to': 'left'})
            }
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
        }
    }
    else
    {
        insert_semicolon_at_line_end(current_line, textEditorEdit)
        vscode.commands.executeCommand('cursorMove', {'to': 'wrappedLineEnd'})
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
             trimmed.startsWith('do'))
    {
        return true
    }
    // function
    else if (trimmed.startsWith('function ') || // javascript
             trimmed.startsWith('func ') || // swift
             trimmed.startsWith('fun ') || // kotlin
             trimmed.startsWith('def ') || // scala
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

function insert_semicolon_at_line_end(line: vscode.TextLine,
                                      textEditorEdit: vscode.TextEditorEdit
                                     ): void
{
    insert_at_end(';', line, textEditorEdit)
}

function insert_at_end(character: string,
                       line: vscode.TextLine, textEditorEdit: vscode.TextEditorEdit
                      ): void
{
    if (line.text.endsWith(character)) {
        textEditorEdit.insert(line.range.end, '\n')
    }
    else
    {
        if (character === ',') // always insert blank line for javascript object
        {
            textEditorEdit.insert(line.range.end, ',\n')
        }
        else
        {
            textEditorEdit.insert(line.range.end, character)
        }
    }
}