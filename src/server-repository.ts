import { ExtensionContext } from "vscode";
import { ServerDetails } from "./server-details";

class ServerRepository {

	private static readonly SERVERS_STORAGE_KEY = "servers";
	private static readonly SELECTION_STORAGE_KEY = "selectedServer"; 
	private static readonly SERVER_PREFIX = "server_"; 

	// Logic to create a key for a server object. 
	private static getServerKey(serverName:string){
		const key = ServerRepository.SERVER_PREFIX + serverName;
		return key; 
	}

	// Clean out the state, used primarily in testing. 
	public static async removeEverything(context: ExtensionContext) {
		for(const k of context.globalState.keys()) {
			await context.globalState.update(k, undefined); 
		}
		// Note that this does not clear out the secrets.  For the purpose of testing I don't think that is necessary. 
	}

	// Retrieve the list of all available servers. 
	public static getServers(context: ExtensionContext) {
		const servers:string[] = (context.globalState.get<string>(ServerRepository.SERVERS_STORAGE_KEY) ?? '').split(";").sort((a,b)=> a.localeCompare(b, undefined, { sensitivity:'base' })).filter(n=>n);
		return servers; 
	}

	// Get a full server object by name. 
	public static async getServer(serverName:string, context: ExtensionContext){
		let result: ServerDetails | null = null;
		const key = ServerRepository.getServerKey(serverName);
		
		const token = await context.secrets.get(key);
		const stringifiedServer = await context.globalState.get<string>(key);

		if(token && stringifiedServer){
			result = JSON.parse(stringifiedServer);
			if(result){
				result.token = token; 
			}
		}

		return result; 
	}

	// Save a full server object. 
	public static async saveServer(addServerState: ServerDetails | null, context: ExtensionContext){
		// Note that this will succeed even if the server already exists.  
		if(addServerState){
			const key = ServerRepository.getServerKey(addServerState.serverName);
			await context.secrets.store(key, addServerState.token);
			const serverString = JSON.stringify({...addServerState, token:''});
			await context.globalState.update(key, serverString);

			let existingServers = ServerRepository.getServers(context);
			existingServers.push(addServerState.serverName);
			const distinctNames = new Set<string>(existingServers);
			existingServers = Array.from(distinctNames);
			const newServerNames = existingServers.join(";");
			await context.globalState.update(ServerRepository.SERVERS_STORAGE_KEY, newServerNames);
		}
		
		return addServerState?.serverName; 
	}

	// Delete a full server object. 
	public static async removeServer(serverName:string, context: ExtensionContext){
		if(serverName){
			const key = ServerRepository.getServerKey(serverName);
			await context.secrets.delete(key);
			await context.globalState.update(key, undefined); 

			const serverNames = context.globalState.get<string>(ServerRepository.SERVERS_STORAGE_KEY) ?? '';
			const serverNamesArray = serverNames.split(";").filter(n => n!==serverName);
			await context.globalState.update("servers",serverNamesArray.join(";"));
		}
	}

	// Get the currently selected server 
	public static getServerSelection(context: ExtensionContext){
		const serverSelection = context.globalState.get<string>(ServerRepository.SELECTION_STORAGE_KEY) ?? '';
		return serverSelection; 
	}

	// Set the currently selected server. 
	public static async saveServerSelection(serverName:string, context: ExtensionContext){
		serverName = serverName ?? '';
		await context.globalState.update(ServerRepository.SELECTION_STORAGE_KEY, serverName);
	}

}

export { ServerRepository };