import * as vscode from 'vscode';
import { ServerDetails } from "./server-details";
import { InfluxDBClient, PointFieldType, PointValues, QueryType } from '@influxdata/influxdb3-client';
import { FLUX_QUERY_PARAMETER_ERROR, InfluxLanguages } from './constants';
import { extractQuery } from './extract-query';
import { QueryParameter, transformQueryParametersToInflux } from './query-parameter';
import { IInfluxFactory } from './influx-factory';
import { cleanStringForCSV } from './csv-utilities';

interface FieldDefinition {field: boolean, name:string, type:PointFieldType | undefined}

// Executes a query using the client 3. 
async function executeSQLQuery(server: ServerDetails | null, query:string | undefined, queryType: QueryType, queryParameters: QueryParameter[] | null | undefined, influxFactory: IInfluxFactory, outputFormat:string, maxRows:number ) {
    let result:string | null = null; 
    if(server && query){
        const client = influxFactory.getClient3(server); 

        try{
            const queryResult = client.queryPoints(query, server.bucket, { type: queryType, params:transformQueryParametersToInflux(queryParameters)});
            if(outputFormat.toLocaleLowerCase() === "csv"){
                result = await readResponseAsCSV(queryResult, maxRows); 
            }
            else if(outputFormat.toLocaleLowerCase() === "weirdcsv"){
                result = await readResponseAsWeirdCSV(queryResult,maxRows); 
            }
            else if(outputFormat.toLocaleLowerCase() === "lineprotocol"){
                result = await readResponseAsLineProtocol(queryResult,maxRows); 
            }
            else {
                result = "Output format not recognized:" + outputFormat;
            }

        }
        catch(ex: any){
            console.log("Error executing query"); 
            result = ex?.message ?? "Error executing query"; 
        }
        finally{
            client.close(); 
        }
    }
    return result;
}

async function readResponseAsCSV(queryResult: AsyncGenerator<PointValues, void, void>, maxRows:number){
    let result:string | null = null; 

    let stuffToIterateThrough: string[] = [];
    let stuffLookup: Record<string,FieldDefinition> = {};
    let rows:string[] = [];

    for await (const row of queryResult) {
        const tagNames = row.getTagNames(); 
        for(const n of tagNames) {
            if(!stuffLookup[n]){
                stuffLookup[n] = {field:false, name: n, type: undefined};
                stuffToIterateThrough.push(n); 
            }
        }

        const fieldNames = row.getFieldNames();
        for(const n of fieldNames){
            if(!stuffLookup[n]){
                stuffLookup[n] = {field:true, name: n, type: row.getFieldType(n)};
                stuffToIterateThrough.push(n); 
            }
        }
        const timestamp = row.getTimestamp();
        
        const parts:string[] = [];
        parts.push(String( timestamp ?? '')); 
        for(const fieldName of stuffToIterateThrough) {
            const myFieldDefinition = stuffLookup[fieldName];
            if(myFieldDefinition.field){
                if( myFieldDefinition.type === 'boolean'){
                    parts.push(String( row.getBooleanField(fieldName)));
                } else if(myFieldDefinition.type === 'float') {
                    parts.push(String( row.getFloatField(fieldName)));
                } else if(myFieldDefinition.type === 'integer') {
                    parts.push(String( row.getIntegerField(fieldName)));
                }else if(myFieldDefinition.type === 'uinteger') {
                    parts.push(String( row.getUintegerField(fieldName)));
                } else {
                    let myS = cleanStringForCSV(row.getStringField(fieldName)); 
                    parts.push(myS);
                }
            }
            else {
                parts.push(row.getTag(fieldName) ?? '');
            }
        }

        let myRow = parts.join(",\t");
        rows.push(myRow); 

        if(tooManyRows(maxRows, rows.length)){
            break; 
        }
    }

    let header1: string[] = ["_time"]; 
    for(const fieldName of stuffToIterateThrough){
        const myFieldDefinition = stuffLookup[fieldName];
        header1.push(cleanStringForCSV(myFieldDefinition.name));
    }

    rows.unshift(header1.join(",\t"));
    result = rows.join("\n");
    return result; 
}

async function readResponseAsWeirdCSV(queryResult: AsyncGenerator<PointValues, void, void>, maxRows:number){
    let result:string | null = null; 

    let stuffToIterateThrough: string[] = [];
    let stuffLookup: Record<string,FieldDefinition> = {};
    let rows:string[] = [];

    for await (const row of queryResult) {
        const tagNames = row.getTagNames(); 
        for(const n of tagNames) {
            if(!stuffLookup[n]){
                stuffLookup[n] = {field:false, name: n, type: undefined};
                stuffToIterateThrough.push(n); 
            }
        }

        const fieldNames = row.getFieldNames();
        for(const n of fieldNames){
            if(!stuffLookup[n]){
                stuffLookup[n] = {field:true, name: n, type: row.getFieldType(n)};
                stuffToIterateThrough.push(n); 
            }
        }
        const timestamp = row.getTimestamp();
        
        const parts:string[] = ["","","0",String( timestamp ?? ''),"measurement"];
        for(const fieldName of stuffToIterateThrough) {
            const myFieldDefinition = stuffLookup[fieldName];
            if(myFieldDefinition.field){
                if( myFieldDefinition.type === 'boolean'){
                    parts.push(String( row.getBooleanField(fieldName)));
                } else if(myFieldDefinition.type === 'float') {
                    parts.push(String( row.getFloatField(fieldName)));
                } else if(myFieldDefinition.type === 'integer') {
                    parts.push(String( row.getIntegerField(fieldName)));
                }else if(myFieldDefinition.type === 'uinteger') {
                    parts.push(String( row.getUintegerField(fieldName)));
                } else {
                    let myS = cleanStringForCSV(row.getStringField(fieldName)); 
                    parts.push(myS);
                }
            }
            else {
                parts.push(row.getTag(fieldName) ?? '');
            }
        }

        let myRow = parts.join(",");
        rows.push(myRow); 

        if(tooManyRows(maxRows, rows.length)){
            break; 
        }
    }

    // This is the header for group, measurement, table, time 
    let header1: string[] = ["#group","false","false","true","true"]; 
    let header2: string[] = ["#datatype","string","long","dateTime","string"]; 
    let header3: string[] = ["#default","","","",""]; 
    let header4: string[] = ["","result","table","_time","_measurement"];
    for(const fieldName of stuffToIterateThrough){
        const myFieldDefinition = stuffLookup[fieldName];
        header1.push(String(myFieldDefinition.field));
        header2.push(String(myFieldDefinition.type ?? "string"));
        header3.push("");
        header4.push(cleanStringForCSV(myFieldDefinition.name));
    }

    rows.unshift(header4.join(","));
    rows.unshift(header3.join(","));
    rows.unshift(header2.join(","));
    rows.unshift(header1.join(","));
    result = rows.join("\n");
    return result; 
}
async function readResponseAsLineProtocol(queryResult: AsyncGenerator<PointValues, void, void>, maxRows:number){
    let result:string | null = null; 
    let rows:string[] = [];

    for await (const row of queryResult) {
        const tagNames = row.getTagNames(); 
        const fieldNames = row.getFieldNames();
        const timestamp = row.getTimestamp();       
        
        const tagSet:string[] = [];
        const fieldSet:string[] = [];

        for(const tagName of tagNames){
            let myS = row.getTag(tagName);
            tagSet.push(`${tagName}=${myS}`);
        }
        for(const fieldName of fieldNames) {
            const fieldType = row.getFieldType(fieldName);
            let myS = "";
            if( fieldType === 'boolean'){
                myS = String( row.getBooleanField(fieldName));
            } else if(fieldType === 'float') {
                myS = String( row.getFloatField(fieldName));
            } else if(fieldType === 'integer') {
                myS = String( row.getIntegerField(fieldName));
            }else if(fieldType === 'uinteger') {
                myS = String( row.getUintegerField(fieldName));
            } else {
                myS = cleanStringForCSV(row.getStringField(fieldName)); 
                myS = myS;
            }

            fieldSet.push(`${fieldName}=${myS}`);
        }

        let myRow = `measurement,${tagSet.join(",")} ${fieldSet.join(",")} ${timestamp}`;
        rows.push(myRow); 

        if(tooManyRows(maxRows, rows.length)){
            break; 
        }
    }

    result = rows.join("\n");
    return result; 
}

// Executes a query using the client 2 
async function executeFluxQuery(server: ServerDetails | null, query:string | undefined, influxFactory: IInfluxFactory, maxRows:number) {
    let result:string | null = null; 
    if(server && query){

        const queryApi = influxFactory.getClient2(server);
        let rows:string[] = [];
        let header:string | null = null; 

        for await (const {values, tableMeta} of queryApi.iterateRows(query)){
            if(!header){
                header = tableMeta.columns.map(n=> cleanStringForCSV(n.label)).join(",\t");
            }
            rows.push(values.map(n=>cleanStringForCSV(n)).join(",\t"));

            if(tooManyRows(maxRows, rows.length)){
                break; 
            }
        }
        rows.unshift(header ?? '');
        result = rows.join("\n");

    }
    return result;
}

function tooManyRows(maxRows:number, rowCount:number){
    if(maxRows <= 0){
        return false; 
    }
    return rowCount >= maxRows; 
}

// Executes the query using either the version 2 or version 3 api depending on language. 
async function executeQuery(server: ServerDetails | null, query:string | undefined, queryType: InfluxLanguages, influxFactory:IInfluxFactory, outputFormat:string, maxRows:number) {

    const {queryText, parameters} = extractQuery(query ?? '');

    if(queryType === 'flux'){
        if(parameters?.length){
            return FLUX_QUERY_PARAMETER_ERROR;
        }
        return await executeFluxQuery(server, queryText, influxFactory, maxRows);
    }
    else {
        return await executeSQLQuery(server, queryText, queryType === 'sql' ? 'sql' : 'influxql', parameters, influxFactory, outputFormat,maxRows);
    }
}

//Used to execute the query against influx and display the output.  
async function executeQueryAndCreateDocument(queryText:string | undefined, serverInfo:ServerDetails | null, displayedEditor: vscode.TextEditor | undefined | null , queryType: InfluxLanguages, influxFactory:IInfluxFactory, outputFormat:string, maxRows:number){
    // Let the user know the execution is starting 
    vscode.window.showInformationMessage(`Executing query against: ${serverInfo?.serverAddress}` );

    // Actually execute against the server. 
    const queryResult = (await executeQuery(serverInfo, queryText, queryType, influxFactory, outputFormat, maxRows)) ?? "Empty Result";

    // If we already have somewhere to display results then display them there.  
    if(displayedEditor){
        try{
            const editSuccess = await displayedEditor.edit(editBuilder => {
                editBuilder.replace(new vscode.Range(displayedEditor.document.lineAt(0).range.start, displayedEditor.document.lineAt(displayedEditor.document.lineCount - 1).range.end), queryResult);
            });
            if(editSuccess){
                return displayedEditor; 
            }
        } catch(ex) {
            // This will happen if the editor is closed.  It would probably be better to capture that event and clear out
            // the editor from state, but this is simpler and the extra time necessary to go through this catch is trivial ultimately. 
            console.warn("Editor was closed, creating a new one. ");
        }
    }
    
    // Here we need to create a new text document to display.  
    const document = await vscode.workspace.openTextDocument({language:"csv", content:queryResult});
    const newEditor = await vscode.window.showTextDocument(document,vscode.ViewColumn.Beside, true);
    return newEditor;
}

export {executeQueryAndCreateDocument}; 