Complete Statement with semicolon in vscode.

Mimic IntelliJ's complete statement.
In other words:

- Complete normal statement with `;`, insert a newline and move down.
- Try to complete complex structures with braces.

Works with languages with a C style syntax.

Install
-------

The version on marketplace is outdated.
Please use [the version on open-vsx.org] ([vscodium] uses open-vsx by default).
You can also download the vsix file at [GitHub releases page][releases],
and manually install it via "vscode > Extensions > Install from VSIX...".

[open-vsx.org]: https://open-vsx.org/extension/weakish/complete-statement
[vscodium]: https://vscodium.com/
[releases]: https://github.com/weakish/vscode-complete-statement/releases

If you want to try the cutting-edge version (`master`),
you can clone this repository, and package it yourself:

```sh
npx vsce package
```

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
let a_number: number = 2;
][
let semicolon: string][ = "already exist";
// `ctrl+;`
let semicolon: string = "already exist";
][
function works_too(para: number][)
// `ctrl+;`
function works_too(para: number) {
    ][
}
// Respects `tabSize` setting. If `tabSize` unset, use 4 spaces.
function works_too(para: number) {
    if (a_number == 1][)
}
// `ctrl+;`
function works_too(para: number) {
    if (a_number == 1) {
        ][
    }
}
```

The above example uses TypeScript,
but this extension works in most languages with a C like style,
such as JavaScript, Java, Ceylon, and C itself.
This extension also works in languages like Kotlin, Scala, Swift, and so on.
But I recommend you only use it to complete complete structures,
not single statement since it will append a semicolon (`;`) at the end.

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

- This extension does not understand semantics of programming languages.
  So complete structure may not work as you expected.

    For example, it cannot completes `if` with multiple line conditions.
    The "parsing" is *very naive*, only covering limited conditions.

- Indented with tab is not supported yet. Pull request is welcome.

License
-------

0BSD
