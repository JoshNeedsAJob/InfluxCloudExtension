import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { ServerRepository } from '../server-repository';
import * as myExtension from '../extension';
import { ServerDetails } from '../server-details';
import { Server } from 'http';

suite('Repository Testing', () => {
    let myExtensionContext:vscode.ExtensionContext;
    suiteSetup(async () => {
        const ext = vscode.extensions.getExtension("joshneedsajob.influxcloudextension");
        myExtensionContext = await ext?.activate();
        vscode.window.showInformationMessage('Start all tests.');
    });

    setup(async ()=>{
        await ServerRepository.removeEverything(myExtensionContext); 
    });

    test('Extension Exists',()=>{
        assert.ok(myExtensionContext); 
    });

	test('Get Servers Test', async () => {
        const myServer: ServerDetails = {
             serverName: "myName",
             serverAddress:"myAddress",
             token:"myToken",
             orgId:"myOrg",
             bucket:"myBucket"
        };

        const yourServer: ServerDetails = {
            serverName: "yourName",
            serverAddress:"yourAddress",
            token:"yourToken",
            orgId:"yourOrg",
            bucket:"yourBucket"
       };

        const noServers = await ServerRepository.getServers(myExtensionContext); 
        assert.ok(noServers);
        assert.strictEqual(noServers.length, 0); 

        const noServer = await ServerRepository.getServer(myServer.serverName, myExtensionContext);
        assert.ok(!noServer);

        const saveMyServerResult = await ServerRepository.saveServer(myServer, myExtensionContext);
        assert.strictEqual(saveMyServerResult, myServer.serverName);

        const oneServers = await ServerRepository.getServers(myExtensionContext); 
        assert.strictEqual(oneServers.length, 1);
        assert.strictEqual(myServer.serverName, oneServers[0]); 

        const retrievedMyServer = await ServerRepository.getServer(myServer.serverName, myExtensionContext);
        assert.deepEqual(retrievedMyServer, myServer); 

        const saveYourServerResult = await ServerRepository.saveServer(yourServer, myExtensionContext); 
        assert.strictEqual(saveYourServerResult, yourServer.serverName); 

        const twoServers = await ServerRepository.getServers(myExtensionContext);
        assert.strictEqual(twoServers.length,2); 
        assert.ok(twoServers.indexOf(myServer.serverName) >= 0);
        assert.ok(twoServers.indexOf(yourServer.serverName) >= 0);

        const retrievedYourServer = await ServerRepository.getServer(yourServer.serverName, myExtensionContext);
        assert.deepEqual(retrievedYourServer, yourServer); 

        await ServerRepository.removeServer(myServer.serverName, myExtensionContext);
        const emptyMyServer = await ServerRepository.getServer(myServer.serverName, myExtensionContext);
        assert.ok(!emptyMyServer);

        const stillThereYourServer = await ServerRepository.getServer(yourServer.serverName, myExtensionContext);
        assert.ok(stillThereYourServer);

        const onlyYourServerLeft = await ServerRepository.getServers(myExtensionContext);
        assert.strictEqual(onlyYourServerLeft.length,1);
        assert.strictEqual(onlyYourServerLeft[0],yourServer.serverName);

        await ServerRepository.removeServer(yourServer.serverName, myExtensionContext);
        const finalEmptyList = await ServerRepository.getServers(myExtensionContext);
        assert.strictEqual(finalEmptyList.length,0); 

	});
});
