Complete Statement with semicolon, comma or braces in vscode.

Mimic IntelliJ's complete statement.
In other words:

- Complete normal statement with `;` and move to line end.
- Try to complete JavaScript object notation
  (or similar structure in other languages) with `,` and move to line end.
- Try to complete complex structures with braces.

Works with languages with a C style syntax.

Key binding
-----------

This extension uses `ctrl+;` (`cmd+;` on mac)
since vscode already uses `ctrl+shift+enter`.

You can rebind `extension.complete-statement` to `ctrl+shift+enter`.

BTW, `ctrl+;` is easier to remember and type than `ctrl+shift+enter`.
I myself use `ctrl+enter` since `ctrl+;` is hard to type in dvorak.

Example
-------

We use `][` to represent cursor.

```typescript
][
let a_number = 2][ # decide to specify type
let a_number: number][ = 2
// press `ctrl+;` (`cmd+;` on mac)
let a_number: number = 2;][
let semicolon: string][ = "already exist";
// `ctrl+;` will start an new blank line
let semicolon: string = "already exist";
][
function works_too(para: number][)
// `ctrl+;`
function works_too(para: number) {][

}
// `down` arrow key
function works_too(para: number) {
    ][
}
// Respects `tabSize` setting. If `tabSize` unset, use 4 spaces.
function works_too(para: number) {
    if (a_number == 1][)
}
// `ctrl+;`
function works_too(para: number) {
    if (a_number == 1) {][

    }
}
// Complete JavaScript object notation with `,`
{
    a: 1][
}
// `ctrl+;`
{
    a: 1,][
}
// Complete one line JavaScript object with `;`
{ a: 1, b: 2 ][}
// `ctrl+;`
{ a: 1, b: 2 };
```

Configuration
-------------

By default, complete-statement uses Java style (beginning brace on same line).
To use Allman style (beginning brace on its own line),
add the following line in settings:

```json
    "complete-statement.allman": true
```

Bugs
----

- As mentioned above, complete structure (if, for, etc) requires `down` arrow key.

    It will not auto moves to the start of next line like IntelliJ.
    Read the source code or [#11841] for more information.

- This extension does not understand semantics of programming languages.
  So complete structure may not work as you expected.

    For example, it cannot completes `if` with multiple line conditions.
    Also it cannot complete functions in C.
    The "parsing" is *very naive*, only covering limited conditions.

- Indented with tab is not supported yet. Pull request is welcome.

[#11841]: https://github.com/Microsoft/vscode/issues/11841

License
-------

0BSD
