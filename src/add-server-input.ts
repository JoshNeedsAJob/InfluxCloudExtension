import { QuickInputButtons,QuickInputButton, window, Disposable, Uri, ExtensionContext } from "vscode";
import { ServerDetails } from "./server-details";
import { ServerRepository } from "./server-repository";
import { ADD_SERVER_LABEL, REMOVE_SERVER_LABEL } from "./constants";

async function addServer(context: ExtensionContext ) {
	const existingServers = await ServerRepository.getServers(context);

	var input = new AddServerInput(existingServers, context);
	
	try{
		let moreSteps = await input.executeStep(); 
		while(moreSteps) {
			moreSteps = await input.executeStep(); 
		}
		return await input.saveResults(); 
	}
	catch{
		return null; 
	}
};

class AddServerInput {

	private step:number = 0; 
	private totalSteps: number = 4; 
	private state: Partial<ServerDetails>;
	private existingServers: string[];
	private context: ExtensionContext; 

	constructor(_existingServers: string[], _context: ExtensionContext){
		this.state = {};
		this.existingServers = _existingServers;
		this.context = _context; 
	}

	public async executeStep() {
		let result:boolean = false; 
		if(this.step === 0){
			result = await this.getServerName(); 
		}else if(this.step === 1 ) {
			result = await this.getServerAddress();
		}else if(this.step === 2 ) {
			result = await this.getToken(); 
		}else if(this.step === 3 ) {
			result = await this.getBucket(); 
		}

		return result; 
	}

	public async saveResults(){
		if(this.state.serverAddress && this.state.serverName && this.state.serverToken && this.state.bucket){
			const newState = this.state as ServerDetails;
			return await ServerRepository.saveServer(newState, this.context); 
		}
		return null; 
	}

	private async getServerName(){
		const CancelButton: QuickInputButton = { tooltip:'Cancel', iconPath:{
			dark: Uri.file(this.context.asAbsolutePath('resources/dark/circle-stop.svg')),
			light: Uri.file(this.context.asAbsolutePath('resources/light/circle-stop.svg')),
		}};

		const disposables: Disposable[] = [];
		try {
			return await new Promise<boolean>((resolve, reject) => {
				const input = window.createInputBox();
				input.title = "Server Label";
				input.step = this.step + 1;
				input.totalSteps = this.totalSteps;
				input.value = this.state.serverName || '';
				input.prompt = "What do you want to call the server?";
				input.placeholder = "New Server";
				input.ignoreFocusOut = true;
				input.buttons = [
					CancelButton
				];
				
				const validate = (newValue:string)=>{
					const isUnique = this.existingServers.every(n=>n !== newValue); 
					const isNotSpecial = newValue.localeCompare(ADD_SERVER_LABEL, undefined, {sensitivity:'base'}) !==0 &&  newValue.localeCompare(REMOVE_SERVER_LABEL, undefined, {sensitivity:'base'}) !==0;
					return isUnique && isNotSpecial; 
				};
				
				disposables.push(
					
					input.onDidTriggerButton(item => {
						reject();
					}),
					input.onDidAccept(async () => {
						const value = input.value.trim() ?? '';
						if (validate(value)) {
							this.state.serverName = value; 
							this.step++; 
							resolve(true);
						}
					}),
					input.onDidChangeValue(async text => {
						if (validate(text)) {
							input.validationMessage = undefined;
						} else {
							input.validationMessage = "Server Name Already Exists";
						}
					}),
					input.onDidHide(() => {
						reject(); 
					}),
					input
				);

				input.show();
			});
		} finally {
			disposables.forEach(d => d.dispose());
		}
	}

	private async getServerAddress(){
		const CancelButton: QuickInputButton = { tooltip:'Cancel', iconPath:{
			dark: Uri.file(this.context.asAbsolutePath('resources/dark/add.svg')),
			light: Uri.file(this.context.asAbsolutePath('resources/light/add.svg')),
		}};

		const disposables: Disposable[] = [];
		try {
			return await new Promise<boolean>((resolve, reject) => {
				const input = window.createInputBox();
				input.title = "Server URL";
				input.step = this.step + 1;
				input.totalSteps = this.totalSteps;
				input.value = this.state.serverAddress || '';
				input.prompt = "Server Address?";
				input.placeholder = "https://";
				input.ignoreFocusOut = true;
				input.buttons = [
					QuickInputButtons.Back,
					CancelButton
				];
				
				const validate = (newValue:string)=>{
					return newValue.length > 3; 
				};
				
				disposables.push(
					input.onDidTriggerButton(item => {
						if(item === QuickInputButtons.Back){
							this.step--;
							resolve(true);
						}else{
							reject(); 
						} 
					}),
					input.onDidAccept(async () => {
						const value = input.value.trim();
						if (validate(value)) {
							this.state.serverAddress = value; 
							this.step++; 
							resolve(true);
						}
					}),
					input.onDidChangeValue(async text => {
						if (validate(text)) {
							input.validationMessage = undefined;
						} else {
							input.validationMessage = "Url is invalid";
						}
					}),
					input.onDidHide(() => {
						reject(); 
					}),
					input
				);

				input.show();
			});
		} finally {
			disposables.forEach(d => d.dispose());
		}
	}

	private async getToken(){
		const CancelButton: QuickInputButton = { tooltip:'Cancel', iconPath:{
			dark: Uri.file(this.context.asAbsolutePath('resources/dark/add.svg')),
			light: Uri.file(this.context.asAbsolutePath('resources/light/add.svg')),
		}};

		const disposables: Disposable[] = [];
		try {
			return await new Promise<boolean>((resolve, reject) => {
				const input = window.createInputBox();
				input.title = "Server Token";
				input.step = this.step + 1;
				input.totalSteps = this.totalSteps;
				input.value = this.state.serverToken || '';
				input.prompt = "Server Token?";
				input.placeholder = "";
				input.ignoreFocusOut = true;
				input.buttons = [
					QuickInputButtons.Back,
					CancelButton
				];
				
				const validate = (newValue:string)=>{
					return newValue.length > 3; 
				};
				
				disposables.push(
					input.onDidTriggerButton(item => {
						if(item === QuickInputButtons.Back){
							this.step--;
							resolve(true);
						}else{
							reject(); 
						} 
					}),
					input.onDidAccept(async () => {
						const value = input.value.trim();
						if (validate(value)) {
							this.state.serverToken = value; 
							this.step++; 
							resolve(true);
						}
					}),
					input.onDidChangeValue(async text => {
						if (validate(text)) {
							input.validationMessage = undefined;
						} else {
							input.validationMessage = "Token is invalid";
						}
					}),
					input.onDidHide(() => {
						reject(); 
					}),
					input
				);

				input.show();
			});
		} finally {
			disposables.forEach(d => d.dispose());
		}
	}

	private async getBucket() {
		const CancelButton: QuickInputButton = { tooltip:'Cancel', iconPath:{
			dark: Uri.file(this.context.asAbsolutePath('resources/dark/add.svg')),
			light: Uri.file(this.context.asAbsolutePath('resources/light/add.svg')),
		}};

		const disposables: Disposable[] = [];
		try {
			return await new Promise<boolean>((resolve, reject) => {
				const input = window.createInputBox();
				input.title = "Bucket";
				input.step = this.step + 1;
				input.totalSteps = this.totalSteps;
				input.value = this.state.bucket || '';
				input.prompt = "Bucket?";
				input.placeholder = "Bucket";
				input.ignoreFocusOut = true;
				input.buttons = [
					QuickInputButtons.Back,
					CancelButton
				];
				
				const validate = (newValue:string)=>{
					return newValue.length > 0; 
				};
				
				disposables.push(
					input.onDidTriggerButton(item => {
						if(item === QuickInputButtons.Back){
							this.step--;
							resolve(true);
						}else{
							reject(); 
						} 
					}),
					input.onDidAccept(async () => {
						const value = input.value.trim();
						if (validate(value)) {
							this.state.bucket = value; 
							this.step++; 
							resolve(true);
						}
					}),
					input.onDidChangeValue(async text => {
						if (validate(text)) {
							input.validationMessage = undefined;
						} else {
							input.validationMessage = "Bucket is invalid";
						}
					}),
					input.onDidHide(() => {
						reject(); 
					}),
					input
				);

				input.show();
			});
		} finally {
			disposables.forEach(d => d.dispose());
		}
	}

}

export {addServer};