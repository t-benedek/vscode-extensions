import * as assert from 'assert';
import * as vscode from 'vscode';
import * as commentsExtensions from '../comments_extensions';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('pressing Enter after a todo item inserts a new bullet line', async () => {
		const document = await vscode.workspace.openTextDocument({
			content: '- task\n',
			language: 'todo'
		});
		const change = {
			range: new vscode.Range(new vscode.Position(0, 6), new vscode.Position(0, 6)),
			text: '\n'
		} as vscode.TextDocumentContentChangeEvent;

		assert.strictEqual(commentsExtensions.shouldAutoInsertTodoBullet(document, change), true);
		assert.strictEqual(commentsExtensions.shouldAutoInsertTodoBullet(document, {
			range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
			text: 'hello'
		} as vscode.TextDocumentContentChangeEvent), false);
	});

	test('pressing Enter after an indented todo item preserves the indentation', async () => {
		const document = await vscode.workspace.openTextDocument({
			content: '  - task\n',
			language: 'todo'
		});
		const change = {
			range: new vscode.Range(new vscode.Position(0, 8), new vscode.Position(0, 8)),
			text: '\n  '
		} as vscode.TextDocumentContentChangeEvent;

		assert.strictEqual(commentsExtensions.shouldAutoInsertTodoBullet(document, change), true);
		assert.strictEqual(commentsExtensions.getTodoBulletPrefix(document.lineAt(0).text), '  - ');
		assert.deepStrictEqual(
			commentsExtensions.getTodoBulletInsertion(document.lineAt(0).text, '  '),
			{ character: 2, text: '- ' }
		);
	});

	test('indented comment lines under a done todo are also marked as done', () => {
		const lines = [
			'- first task @done',
			'  first comment',
			'    second comment',
			'- next task',
			'  next comment'
		];

		assert.deepStrictEqual(commentsExtensions.getDoneTodoDecorationLines(lines), [0, 1, 2]);
		assert.strictEqual(commentsExtensions.isIndentedCommentLine('  comment'), true);
		assert.strictEqual(commentsExtensions.isIndentedCommentLine('- comment'), false);
	});
});
