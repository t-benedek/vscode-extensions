import * as vscode from 'vscode';

// Examples:
// "  comment" → true
// "       additional comment" → true
// "- Task" → false
// "Text without indentation" → false
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

    if (!/^(?:\r\n|\r|\n)[\t ]*$/.test(change.text)) {
        return false;
    }

    const currentLine = document.lineAt(change.range.start.line).text;
    return currentLine.trimStart().startsWith('-');
}

export function getTodoBulletPrefix(lineText: string): string {
    const match = lineText.match(/^(\s*)-\s*/);

    if (!match) {
        return '- ';
    }

    return `${match[1]}- `;
}

export function getTodoBulletInsertion(lineText: string, nextLineText: string): { character: number; text: string } {
    const bulletPrefix = getTodoBulletPrefix(lineText);
    const currentIndentation = bulletPrefix.match(/^\s*/)?.[0] ?? '';
    const nextLineIndentation = nextLineText.match(/^\s*/)?.[0] ?? '';
    const insertCharacter = nextLineIndentation.length;

    if (currentIndentation.startsWith(nextLineIndentation)) {
        return {
            character: insertCharacter,
            text: `${currentIndentation.slice(nextLineIndentation.length)}- `
        };
    }

    return {
        character: 0,
        text: bulletPrefix
    };
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

    const nextLineIndex = firstChange.range.start.line + 1;
    const currentLine = event.document.lineAt(firstChange.range.start.line).text;
    const nextLineText = nextLineIndex < event.document.lineCount
        ? event.document.lineAt(nextLineIndex).text
        : '';
    const insertion = getTodoBulletInsertion(currentLine, nextLineText);
    const edit = new vscode.WorkspaceEdit();
    const insertPosition = new vscode.Position(nextLineIndex, insertion.character);
    edit.insert(event.document.uri, insertPosition, insertion.text);

    await vscode.workspace.applyEdit(edit);
}
