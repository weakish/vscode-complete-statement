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

function complete_statement(textEditor: TextEditor,
                            textEditorEdit: TextEditorEdit
                           ): void
{
    let current_line_number: number = textEditor.selection.start.line
    let current_line: TextLine = textEditor.document.lineAt(current_line_number)
    if (looks_like_json(current_line))
    {
        insert_comma_at_line_end(current_line, textEditorEdit)
        commands.executeCommand('cursorMove', {'to': 'wrappedLineEnd'})
    }
    else if (current_line.text.trim() === '}')
    {
        commands.executeCommand('cursorMove', {'to': 'up'})
        commands.executeCommand('cursorMove', {'to': 'wrappedLineEnd'})
    }
    else if (looks_like_complex_structure(current_line))
    {
        if (current_line.text.endsWith('{'))
        {
            commands.executeCommand('cursorMove', {'to': 'down'})
            commands.executeCommand('cursorMove', {'to': 'wrappedLineEnd'})
        }
        else
        {
            // Assuming use spaces to indent.
            const tab_stop: number = getConfiguration('editor').get('tabSize', 4)
            let indent_level: number
            if (current_line.text.startsWith(' ')) // indented
            {
                const indent_position: number =
                        current_line.text.lastIndexOf(" ".repeat(tab_stop))
                indent_level = indent_position / tab_stop + 1
            } else
            {
                indent_level = 0
            }
            const indent_space_count: number = tab_stop * (indent_level + 1)
            const indent_spaces: string = " ".repeat(indent_space_count)
            const less_indent_spaces: string = " ".repeat(tab_stop * indent_level)
            let braces: string
            const allman: boolean =
                    getConfiguration('complete-statement').get('allman', false)
            if (allman)
            {
                braces = `\n${less_indent_spaces}{\n${indent_spaces}` +
                        `\n${less_indent_spaces}}`
                textEditorEdit.insert(current_line.range.end, braces)
                commands.executeCommand('cursorMove', {'to': 'wrappedLineEnd'})
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
                    braces = ` ${braces}`;
                }
                textEditorEdit.insert(current_line.range.end, braces)
                commands.executeCommand('cursorMove', {'to': 'left'})
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
        commands.executeCommand('cursorMove', {'to': 'wrappedLineEnd'})
    }
}

function looks_like_key(text: string, quote: string): boolean
{
    if (text.length === 1)
    {
        return false
    }
    else if (text.endsWith(`\${quote}`))
    {
        // Ignore rare valid forms like `'\\': 1`.
        return false
    }
    else if (text.endsWith(quote))
    {
        return true
    }
    else
    {
        return false
    }
}

function looks_like_json(line: TextLine): boolean
{
    // `Class::method`
    if (line.text.includes('::'))
    {
        return false
    }
    // { 'a': 1, 'b': 2 }
    else if (line.text.includes('{') || line.text.includes('}'))
    {
        return false
    }
    // a: 1
    else if (line.text.includes(':'))
    {
        // Exclude `:` in strings.
        const colon_position: number = line.text.indexOf(':')
        const before_colon: string = line.text.slice(0, colon_position)
        if (before_colon.includes("'") ||
            before_colon.includes('"') ||
            before_colon.includes('`'))
        {
            const trimmed_before_colon = before_colon.trim()
            if (trimmed_before_colon.startsWith('"'))
            {
                return looks_like_key(trimmed_before_colon, '"')
            }
            else if (trimmed_before_colon.startsWith("'"))
            {
                return looks_like_key(trimmed_before_colon, "'")
            }
            else if (trimmed_before_colon.startsWith("`"))
            {
                return looks_like_key(trimmed_before_colon, "`")
            }
            else if (trimmed_before_colon.startsWith('['))
            {
                if (trimmed_before_colon.endsWith(']'))
                {
                    // Ignore rare non literal object forms like `["a", "]:"]`.
                    return true
                }
                else
                {
                    return false
                }
            }
            else
            {
                return false
            }
        }
        else
        {
            return true
        }
    }
    else
    {
        return false
    }
}

function looks_like_complex_structure(line: TextLine): boolean
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

function insert_comma_at_line_end(line: TextLine,
                                  textEditorEdit: TextEditorEdit
                                 ): void
{
    insert_at_end(',', line, textEditorEdit)
}

function insert_semicolon_at_line_end(line: TextLine,
                                      textEditorEdit: TextEditorEdit
                                     ): void
{
    insert_at_end(';', line, textEditorEdit)
}

function insert_at_end(character: string,
                       line: TextLine, textEditorEdit: TextEditorEdit
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