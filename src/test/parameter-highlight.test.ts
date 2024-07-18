import * as assert from 'assert';
import * as sinon from 'sinon';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { triggerUpdateDecorations } from '../parameter-highlight';
// import * as myExtension from '../extension';

suite('Parameter Highlight', () => {
	

	test('No Matches', async () => {
        const setDecorations = sinon.spy();
        const document = await vscode.workspace.openTextDocument({language:"sql", content:"Here is some stuff\nAnd antoher line\nno matches"});
        const editor = {
            setDecorations: setDecorations, 
            document: document 
        } as any as vscode.TextEditor; 
        triggerUpdateDecorations(editor, false);

        assert.strictEqual(setDecorations.callCount,3);
        setDecorations.alwaysCalledWithMatch(sinon.match.any, sinon.match.has("length",0));
	});

	test('Match With Type', async () => {
        const setDecorations = sinon.spy();
        const document = await vscode.workspace.openTextDocument({language:"sql", content:"Here is some stuff\nAnd antoher line\nno matches\n #$param1:string=somestring \nmore stuff"});
        const editor = {
            setDecorations: setDecorations, 
            document: document 
        } as any as vscode.TextEditor; 
        triggerUpdateDecorations(editor, false);

        assert.strictEqual(setDecorations.callCount,3);
        assert.ok(setDecorations.alwaysCalledWithMatch(sinon.match.any, sinon.match.has("length",1)));
        const nameCallRange = (setDecorations.getCall(0).lastArg as vscode.DecorationOptions[])[0].range;
        const typeCallRange = (setDecorations.getCall(1).lastArg as vscode.DecorationOptions[])[0].range;
        const contentCallRange = (setDecorations.getCall(2).lastArg as vscode.DecorationOptions[])[0].range;

        assert.equal(nameCallRange.start.line,3, "Name Call Range line Start Incorrect");
        assert.equal(nameCallRange.start.character,3, "Name Call Range char Start Incorrect");
        assert.equal(nameCallRange.end.line,3, "Name Call Range line End Incorrect");
        assert.equal(nameCallRange.end.character,9, "Name Call Range char End Incorrect");
        assert.equal(typeCallRange.start.line,3, "Type Call Range line Start Incorrect");
        assert.equal(typeCallRange.start.character,10, "Type Call Range char Start Incorrect");
        assert.equal(typeCallRange.end.line,3, "Type Call Range line End Incorrect");
        assert.equal(typeCallRange.end.character,16, "Type Call Range char End Incorrect");
        assert.equal(contentCallRange.start.line,3, "Content Call Range line Start Incorrect");
        assert.equal(contentCallRange.start.character,17, "Content Call Range char Start Incorrect");
        assert.equal(contentCallRange.end.line,3, "Content Call Range line End Incorrect");
        assert.equal(contentCallRange.end.character,28, "Content Call Range char End Incorrect");

	});

	test('Match Without Type', async () => {
        const setDecorations = sinon.spy();
        const document = await vscode.workspace.openTextDocument({language:"sql", content:"Here is some stuff\nAnd antoher line\nno matches\n #$param1=somestring \nmore stuff"});
        const editor = {
            setDecorations: setDecorations, 
            document: document 
        } as any as vscode.TextEditor; 
        triggerUpdateDecorations(editor, false);

        assert.strictEqual(setDecorations.callCount,3);
        
        const nameCallRange = (setDecorations.getCall(0).lastArg as vscode.DecorationOptions[])[0].range;
        const contentCallRange = (setDecorations.getCall(2).lastArg as vscode.DecorationOptions[])[0].range;

        assert.ok(setDecorations.getCall(1).calledWithMatch(sinon.match.any, sinon.match.has("length",0)));

        assert.equal(nameCallRange.start.line,3, "Name Call Range line Start Incorrect");
        assert.equal(nameCallRange.start.character,3, "Name Call Range char Start Incorrect");
        assert.equal(nameCallRange.end.line,3, "Name Call Range line End Incorrect");
        assert.equal(nameCallRange.end.character,9, "Name Call Range char End Incorrect");
        assert.equal(contentCallRange.start.line,3, "Content Call Range line Start Incorrect");
        assert.equal(contentCallRange.start.character,10, "Content Call Range char Start Incorrect");
        assert.equal(contentCallRange.end.line,3, "Content Call Range line End Incorrect");
        assert.equal(contentCallRange.end.character,21, "Content Call Range char End Incorrect");

	});

    test('Multiple Matches', async () => {
        const setDecorations = sinon.spy();
        const document = await vscode.workspace.openTextDocument({language:"sql", content:" #$param1:string=somestring\n#$param2:boolean=true\n#$param3:number=123\n#$param4:bool=false"});
        const editor = {
            setDecorations: setDecorations, 
            document: document 
        } as any as vscode.TextEditor; 
        triggerUpdateDecorations(editor, false);

        assert.strictEqual(setDecorations.callCount,3);

        assert.ok(setDecorations.getCall(0).calledWithMatch(sinon.match.any, sinon.match.has("length",3)));
        assert.ok(setDecorations.getCall(1).calledWithMatch(sinon.match.any, sinon.match.has("length",3)));
        assert.ok(setDecorations.getCall(2).calledWithMatch(sinon.match.any, sinon.match.has("length",3)));

	});

});
