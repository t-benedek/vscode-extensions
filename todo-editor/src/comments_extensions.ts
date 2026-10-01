import * as vscode from 'vscode';

// "  Kommentar" → true
// "       weiterer Text" → true
// "- Aufgabe" → false
// "Text ohne Einrückung" → false
export function isIndentedCommentLine(lineText: string): boolean {
    if (!lineText || lineText.trim() === '') {
        return false;
    }

    return /^\s+\S/.test(lineText) && !lineText.trimStart().startsWith('-');
}

export function getDoneTodoDecorationLines(lines: string[]): number[] {
    const result: number[] = [];

    for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i];

        if (!lineText.includes('@done')) {
            continue;
        }

        result.push(i);

        for (let j = i + 1; j < lines.length; j++) {
            const nextLine = lines[j];

            if (nextLine.trim() === '') {
                continue;
            }

            if (isIndentedCommentLine(nextLine)) {
                result.push(j);
                continue;
            }

            break;
        }
    }

    return result;
}

export function shouldAutoInsertTodoBullet(
    document: vscode.TextDocument,
    change: vscode.TextDocumentContentChangeEvent
): boolean {
    if (!change || !change.text) {
        return false;
    }

    if (!/^(?:\r\n|\r|\n)$/.test(change.text)) {
        return false;
    }

    const currentLine = document.lineAt(change.range.start.line).text;
    return currentLine.trimStart().startsWith('-');
}

export async function autoInsertTodoBulletOnEnter(event: vscode.TextDocumentChangeEvent): Promise<void> {
    if (event.contentChanges.length === 0) {
        return;
    }

    const firstChange = event.contentChanges[0];
    if (event.document.languageId !== 'todo' && !event.document.fileName.endsWith('.todo')) {
        return;
    }

    if (!shouldAutoInsertTodoBullet(event.document, firstChange)) {
        return;
    }

    const edit = new vscode.WorkspaceEdit();
    const insertPosition = new vscode.Position(firstChange.range.start.line + 1, 0);
    edit.insert(event.document.uri, insertPosition, '- ');

    await vscode.workspace.applyEdit(edit);
}
