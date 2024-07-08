// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ADD_SERVER_LABEL, NO_SELECTION_MESSAGE, REMOVE_SERVER_LABEL } from './constants';
import { addServer } from './add-server-input';
import { ServerRepository } from './server-repository';
import { executeQuery, executeQueryAndCreateDocument } from './query-executor';

let relevantLangages = new Set<string>(['sql','flux','influxql']); 
let myStatusBarItem: vscode.StatusBarItem; 
let myServer:string; 
let displayedEditor: vscode.TextEditor; 

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	myServer = NO_SELECTION_MESSAGE;

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "influxcloudextension" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const selectServerCommandId = 'influxcloudextension.influxservers';
	const selectServerCommand = vscode.commands.registerCommand(selectServerCommandId, () => {
		let servers = ServerRepository.getServers(context); 

		const quickPick = vscode.window.createQuickPick(); 
		const quickPickItems = servers.map(label=>{return {label};});
		quickPickItems.push({label:ADD_SERVER_LABEL});
		quickPickItems.push({label:REMOVE_SERVER_LABEL});

		quickPick.items = quickPickItems; 

		quickPick.onDidChangeSelection(selection=>{
			const selectionLabel = selection?.[0]?.label;
			if(selectionLabel === ADD_SERVER_LABEL){
				// In this block we add a new server.
				// The add server method executes the UX and puts the new server into the server array if needed. 
				addServer(context)
				.then((newServer) => { 
					// Now that we have a new server we update our selected server, list of servers and the status bar. 
					myServer = newServer ?? myServer;
					updateStatusBarItem(); 
					return ServerRepository.saveServerSelection(myServer, context);
				}).catch(()=>{
					console.log("Adding server cancelled.");
				});
			}
			else if(selectionLabel === REMOVE_SERVER_LABEL) {
				// In this block we remove the selected server. 
				// The remove server block will take the selected server out of the server list and save the result. 
				ServerRepository.removeServer( myServer, context).then(()=>{
					// Here we update the status bar and list of servers. 
					myServer = NO_SELECTION_MESSAGE;
					updateStatusBarItem(); 	
					quickPick.hide();
					return ServerRepository.saveServerSelection('', context);
				}); 
			}
			else if(selectionLabel){
				// In this block we select a new server. 
				// The server is updated locally, and then the status bar is updated. 
				
				myServer = selectionLabel; 
				updateStatusBarItem(); 

				// Here we update the saved server selection.  This block is async, but we call it without await because we don't need the result.  
				ServerRepository.saveServerSelection(myServer, context);
				ServerRepository.getServer(selectionLabel, context).then((serverInfo)=>{
					vscode.window.showInformationMessage(`Selected name=${serverInfo?.serverName}, address=${serverInfo?.serverAddress}, token=${serverInfo?.serverToken}, bucket=${serverInfo?.bucket}` );
				});
				quickPick.hide(); 
			}
			
		});
		quickPick.onDidHide(()=>quickPick.dispose());
		quickPick.show(); 

	});
	context.subscriptions.push(selectServerCommand);

	const executeQueryCommandId = 'influxcloudextension.influxquery';
	const executeQueryCommand = vscode.commands.registerCommand(executeQueryCommandId, () => {
		const selectionLabel = ServerRepository.getServerSelection(context) || NO_SELECTION_MESSAGE;
		const queryText = vscode.window.activeTextEditor?.document.getText();
		executeQueryAndCreateDocument(selectionLabel, queryText, context, displayedEditor)
		.then(newDisplayedEditor => {
			displayedEditor = newDisplayedEditor; 
		})
		.catch(err => {
			vscode.window.showErrorMessage("Query execution failed" );
			console.error("Unable to execute query");
		});
	});
	context.subscriptions.push(executeQueryCommand);

	// Create the status bar and show it when the file is relevant
	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	myStatusBarItem.command = selectServerCommandId;
	context.subscriptions.push(myStatusBarItem);

	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem)); 

	// Grab the saved server if it exists. 
	myServer = ServerRepository.getServerSelection(context) || NO_SELECTION_MESSAGE;

	updateStatusBarItem(); 
}

function updateStatusBarItem(e?: vscode.TextEditor):void {
	
	e = e ?? vscode.window.activeTextEditor;
	if(relevantLangages.has(e?.document?.languageId ?? '')){
		myStatusBarItem.text = myServer;
		myStatusBarItem.show(); 
	} else {
		myStatusBarItem.hide();
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
