import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('todo-editor: extension activated');

    // 1. Definition der Farben und Styles
    const blueTodoDecoration = vscode.window.createTextEditorDecorationType({
        color: '#1E90FF', 
        fontWeight: 'bold'
    });

    const grayDoneDecoration = vscode.window.createTextEditorDecorationType({
        color: '#808080', 
        textDecoration: 'line-through' 
    });

    const orangeHeaderDecoration = vscode.window.createTextEditorDecorationType({
        color: '#FF8C00',
        fontWeight: '700',
        textDecoration: 'none; font-size: 1.15em;'
    });

    // Hilfsfunktion: Nur .todo-Dateien dekorieren
    function shouldDecorateEditor(editor: vscode.TextEditor | undefined): editor is vscode.TextEditor {
        if (!editor) return false;
        return editor.document.fileName.endsWith('.todo');
    }

    // Funktion, die das Dokument scannt und die Farben verteilt
    function updateDecorations(editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor) {
        if (!shouldDecorateEditor(editor)) return;

        const text = editor.document.getText();
        const blueDecorations: vscode.DecorationOptions[] = [];
        const grayDecorations: vscode.DecorationOptions[] = [];
        const orangeDecorations: vscode.DecorationOptions[] = [];

        const lines = text.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
            const lineText = lines[i];
            
            if (lineText.includes('@done')) {
                const startPos = new vscode.Position(i, 0);
                const endPos = new vscode.Position(i, lineText.length);
                grayDecorations.push({ range: new vscode.Range(startPos, endPos) });
            } 
            else if (lineText.trimEnd().endsWith(':')) {
                const startPos = new vscode.Position(i, 0);
                const endPos = new vscode.Position(i, lineText.length);
                orangeDecorations.push({ range: new vscode.Range(startPos, endPos) });
            }
            else if (lineText.trim().startsWith('-')) {
                const startPos = new vscode.Position(i, 0);
                const endPos = new vscode.Position(i, lineText.length);
                blueDecorations.push({ range: new vscode.Range(startPos, endPos) });
            }
        }

        editor.setDecorations(blueTodoDecoration, blueDecorations);
        editor.setDecorations(grayDoneDecoration, grayDecorations);
        editor.setDecorations(orangeHeaderDecoration, orangeDecorations);
    }

    // Trigger für das Einfärben
    if (vscode.window.activeTextEditor) {
        updateDecorations(vscode.window.activeTextEditor);
    }
    vscode.window.onDidChangeActiveTextEditor((editor) => updateDecorations(editor), null, context.subscriptions);
    vscode.window.onDidChangeVisibleTextEditors((editors) => {
        editors.forEach((editor) => updateDecorations(editor));
    }, null, context.subscriptions);
    vscode.workspace.onDidOpenTextDocument((document) => {
        const openEditor = vscode.window.visibleTextEditors.find((editor) => editor.document === document);
        if (openEditor) {
            updateDecorations(openEditor);
        }
    }, null, context.subscriptions);
    vscode.workspace.onDidChangeTextDocument((event) => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) return;
        if (event.document === activeEditor.document) {
            updateDecorations(activeEditor);
        }
    }, null, context.subscriptions);

    // 2. Code Completion (Autovervollständigung) - NUR für das "todo"-Sprach-ID
    const completionProvider = vscode.languages.registerCompletionItemProvider(
        { language: 'todo' }, // Filtert direkt nativ auf deine neue Dateiendung
        {
            provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
                const lineText = document.lineAt(position).text;
                if (!lineText.includes('-')) return [];

                const completionItem = new vscode.CompletionItem('@done', vscode.CompletionItemKind.Keyword);
                completionItem.detail = 'To-Do als erledigt markieren';
                completionItem.documentation = 'Färbt diese Zeile grau und streicht sie durch.';

                return [completionItem];
            }
        },
        '@' 
    );

    context.subscriptions.push(completionProvider);
}

export function deactivate() {}
