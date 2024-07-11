import * as assert from 'assert';
import * as sinon from 'sinon';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { executeQueryAndCreateDocument } from '../query-executor';
import { IInfluxFactory } from '../influx-factory';
import { ServerDetails } from '../server-details';
import { FluxTableMetaData, QueryApi } from '@influxdata/influxdb-client';
import { InfluxDBClient, PointFieldType, PointValues } from '@influxdata/influxdb3-client';
import { createMockAsyncIterator, multiResultFake, returnDateShiftedByMinutes } from './test-utils';
import { FLUX_QUERY_PARAMETER_ERROR } from '../constants';

suite('Query Executor', ()=>{
    let client2: QueryApi | null = null;
    let client3: InfluxDBClient | null = null; 
    let server: ServerDetails = {
        serverName:'MyName',
        serverAddress:'MyAddress',
        token:'MyToken',
        bucket:'MyBucket',
        orgId:'MyOrgId'
    };

    const factory: IInfluxFactory = {
        getClient3 : (server:ServerDetails)=>{
            return client3!; 
        },

        getClient2 : (server:ServerDetails) => {
            return client2!;
        }
    };

    test('Empty Query',async ()=>{
        client3 = {} as InfluxDBClient; 
        const result = await executeQueryAndCreateDocument(undefined, null, null, "sql", factory );
        assert.ok(result); 
        const emptyText = result.document.getText();
        assert.equal(emptyText, "Empty Result");
    });

    test('Simple SQL Query',async ()=>{
        const fields = [`f"i"el,d1`,"field2","field3"];
        const tags = ["tag1",`t"a"g,2`,"tag3"];
        const ts = new Date();
        ts.setHours(0,0,0,0);
        const pointValues: PointValues[] = [{
            getFieldNames: sinon.fake.returns(fields),
            getTagNames: sinon.fake.returns(tags),
            getTimestamp: sinon.fake.returns(returnDateShiftedByMinutes(ts,1)),
            getFieldType: multiResultFake<PointFieldType>(['string','boolean','float']),
            getStringField: sinon.fake.returns("stringvalue1"),
            getBooleanField: sinon.fake.returns(true),
            getFloatField: sinon.fake.returns(12.34),
            getTag: multiResultFake<string>(["tagvalue1","tagvalue2","tagvalue3"])
        } as any as PointValues,{
            getFieldNames: sinon.fake.returns(fields),
            getTagNames: sinon.fake.returns(tags),
            getTimestamp: sinon.fake.returns(returnDateShiftedByMinutes(ts,2)),
            getFieldType: multiResultFake<PointFieldType>(['string','boolean','float']),
            getStringField: sinon.fake.returns("stringvalue1"),
            getBooleanField: sinon.fake.returns(false),
            getFloatField: sinon.fake.returns(0),            
            getTag: multiResultFake<string>([`t"a"gva,lue1`,"tagvalue2","tagvalue3"])
        } as any as PointValues,{
            getFieldNames: sinon.fake.returns(fields),
            getTagNames: sinon.fake.returns(tags),
            getTimestamp: sinon.fake.returns(returnDateShiftedByMinutes(ts,3)),
            getFieldType: multiResultFake<PointFieldType>(['string','boolean','float']),
            getStringField: sinon.fake.returns(`s"t"ring,value1`),
            getBooleanField: sinon.fake.returns(true),
            getFloatField: sinon.fake.returns(-95.2),            
            getTag: multiResultFake<string>([`t"a"gva,lue1`,"tagvalue2","tagvalue3"])
        } as any as PointValues]; 

        const queryPointsSpy = sinon.fake.returns(pointValues);
        client3 = {
            queryPoints: queryPointsSpy as any,
            close: sinon.fake as any
        } as InfluxDBClient; 
        const query = "SELECT * FROM MEASUREMENTS";
        
        const result = await executeQueryAndCreateDocument(query, server, null, "sql", factory );
        assert.ok(result); 
        const emptyText = result.document.getText();
        const lines = emptyText.split("\n");
        assert.strictEqual(lines.length, 4);
        const headerParts = lines[0].split(",").map(n=>n.trim()); 
        assert.strictEqual(headerParts.length, 9);
        const lastRowParts = lines[3].split(",").map(n=>n.trim()); 
        assert.strictEqual(lastRowParts.length, 9);
        assert.strictEqual(lines[0].indexOf(`""`), 15);

        assert.ok(queryPointsSpy.calledOnce); 
        assert.equal(queryPointsSpy.args[0][2].type, "sql");
    });

    test('SQL Query with parameters',async ()=>{
        const fields = ["field1"];
        const tags = ["tag1"];
        const ts = new Date();
        ts.setHours(0,0,0,0);
        const pointValues: PointValues[] = [{
            getFieldNames: sinon.fake.returns(fields),
            getTagNames: sinon.fake.returns(tags),
            getTimestamp: sinon.fake.returns(returnDateShiftedByMinutes(ts,1)),
            getFieldType: sinon.fake.returns("string"),
            getStringField: sinon.fake.returns("stringvalue1"),
            getTag: sinon.fake.returns("tagvalue1")
        } as any as PointValues]; 

        const queryPointsSpy = sinon.fake.returns(pointValues);
        client3 = {
            queryPoints: queryPointsSpy as any,
            close: sinon.fake as any
        } as InfluxDBClient; 
        const query = "#$param1:string = something1 \n #$param2:boolean = true \n #$param3:number = 4.5\n#$param4 = something2 \n SELECT * FROM MEASUREMENTS";
        
        const result = await executeQueryAndCreateDocument(query, server, null, "sql", factory );
        assert.ok(result); 
        const emptyText = result.document.getText();
        const lines = emptyText.split("\n");
        assert.strictEqual(lines.length, 2);

        assert.ok(queryPointsSpy.calledOnce); 
        assert.equal(queryPointsSpy.args[0][2].params["param1"],"something1");
        assert.equal(queryPointsSpy.args[0][2].params["param2"],true);
        assert.equal(queryPointsSpy.args[0][2].params["param3"],4.5);
        assert.equal(queryPointsSpy.args[0][2].params["param4"],"something2");
        assert.equal(queryPointsSpy.args[0][2].type, "sql");
    });

    test('Simple InfluxQL Query',async ()=>{
        const fields = [`f"i"el,d1`,"field2","field3"];
        const tags = ["tag1",`t"a"g,2`,"tag3"];
        const ts = new Date();
        ts.setHours(0,0,0,0);
        const pointValues: PointValues[] = [{
            getFieldNames: sinon.fake.returns(fields),
            getTagNames: sinon.fake.returns(tags),
            getTimestamp: sinon.fake.returns(returnDateShiftedByMinutes(ts,1)),
            getFieldType: multiResultFake<PointFieldType>(['string','boolean','float']),
            getStringField: sinon.fake.returns("stringvalue1"),
            getBooleanField: sinon.fake.returns(true),
            getFloatField: sinon.fake.returns(12.34),
            getTag: multiResultFake<string>(["tagvalue1","tagvalue2","tagvalue3"])
        } as any as PointValues,{
            getFieldNames: sinon.fake.returns(fields),
            getTagNames: sinon.fake.returns(tags),
            getTimestamp: sinon.fake.returns(returnDateShiftedByMinutes(ts,2)),
            getFieldType: multiResultFake<PointFieldType>(['string','boolean','float']),
            getStringField: sinon.fake.returns("stringvalue1"),
            getBooleanField: sinon.fake.returns(false),
            getFloatField: sinon.fake.returns(0),            
            getTag: multiResultFake<string>([`t"a"gva,lue1`,"tagvalue2","tagvalue3"])
        } as any as PointValues,{
            getFieldNames: sinon.fake.returns(fields),
            getTagNames: sinon.fake.returns(tags),
            getTimestamp: sinon.fake.returns(returnDateShiftedByMinutes(ts,3)),
            getFieldType: multiResultFake<PointFieldType>(['string','boolean','float']),
            getStringField: sinon.fake.returns(`s"t"ring,value1`),
            getBooleanField: sinon.fake.returns(true),
            getFloatField: sinon.fake.returns(-95.2),            
            getTag: multiResultFake<string>([`t"a"gva,lue1`,"tagvalue2","tagvalue3"])
        } as any as PointValues]; 

        const queryPointsSpy = sinon.fake.returns(pointValues);
        client3 = {
            queryPoints: queryPointsSpy as any,
            close: sinon.fake as any
        } as InfluxDBClient; 
        const query = "SELECT * FROM MEASUREMENTS";
        
        const result = await executeQueryAndCreateDocument(query, server, null, "influxql", factory );
        assert.ok(result); 
        const emptyText = result.document.getText();
        const lines = emptyText.split("\n");
        assert.strictEqual(lines.length, 4);
        const headerParts = lines[0].split(",").map(n=>n.trim()); 
        assert.strictEqual(headerParts.length, 9);
        const lastRowParts = lines[3].split(",").map(n=>n.trim()); 
        assert.strictEqual(lastRowParts.length, 9);
        assert.strictEqual(lines[0].indexOf(`""`), 15);

        assert.ok(queryPointsSpy.calledOnce); 
        assert.equal(queryPointsSpy.args[0][2].type, "influxql");
    });

    test('InfluxQL Query with parameters',async ()=>{
        const fields = ["field1"];
        const tags = ["tag1"];
        const ts = new Date();
        ts.setHours(0,0,0,0);
        const pointValues: PointValues[] = [{
            getFieldNames: sinon.fake.returns(fields),
            getTagNames: sinon.fake.returns(tags),
            getTimestamp: sinon.fake.returns(returnDateShiftedByMinutes(ts,1)),
            getFieldType: sinon.fake.returns("string"),
            getStringField: sinon.fake.returns("stringvalue1"),
            getTag: sinon.fake.returns("tagvalue1")
        } as any as PointValues]; 

        const queryPointsSpy = sinon.fake.returns(pointValues);
        client3 = {
            queryPoints: queryPointsSpy as any,
            close: sinon.fake as any
        } as InfluxDBClient; 
        const query = "#$param1:string = something1 \n #$param2:boolean = true \n #$param3:number = 4.5\n#$param4 = something2 \n SELECT * FROM MEASUREMENTS";
        
        const result = await executeQueryAndCreateDocument(query, server, null, "influxql", factory );
        assert.ok(result); 
        const emptyText = result.document.getText();
        const lines = emptyText.split("\n");
        assert.strictEqual(lines.length, 2);

        assert.ok(queryPointsSpy.calledOnce); 
        assert.equal(queryPointsSpy.args[0][2].params["param1"],"something1");
        assert.equal(queryPointsSpy.args[0][2].params["param2"],true);
        assert.equal(queryPointsSpy.args[0][2].params["param3"],4.5);
        assert.equal(queryPointsSpy.args[0][2].params["param4"],"something2");
        assert.equal(queryPointsSpy.args[0][2].type, "influxql");
    });

    test('Simple Flux Query',async ()=>{
        const fields = [`f"i"el,d1`,"field2","field3"];
        const tags = ["tag1",`t"a"g,2`,"tag3"];
        const ts = new Date();
        ts.setHours(0,0,0,0);

        const tableMeta: FluxTableMetaData = {
           columns:[{label:"time"},{label:"tag1"},{label:`t"a"g,2`},{label:"tag3"},{label:`f"i"el,d1`},{label:"field2"},{label:"field3"}]
        } as any as FluxTableMetaData; 
        const rows = [{
                 values:[returnDateShiftedByMinutes(ts,1).toISOString(),`t"a"gva,lue1`,"tagvalue2","tagvalue3","something","true","12.34"],
                 tableMeta
             },{
                 values:[returnDateShiftedByMinutes(ts,2).toISOString(),`t"a"gva,lue1`,"tagvalue2","tagvalue3","row2","false","0"],
                 tableMeta
             },{
                 values:[returnDateShiftedByMinutes(ts,3).toISOString(),`t"a"gva,lue1`,"tagvalue2","tagvalue3",`s"t"ring,value1`,"true","-95.2"],
                 tableMeta
             }]; 
        
        const myAsyncIterable = createMockAsyncIterator(rows);
        const iterateRowsSpy = sinon.fake.returns(myAsyncIterable);
        client2 = {
            iterateRows: iterateRowsSpy as any,
        } as QueryApi; 
        const query = "SELECT * FROM MEASUREMENTS";
        
        const result = await executeQueryAndCreateDocument(query, server, null, "flux", factory );
        assert.ok(result); 
        const emptyText = result.document.getText();
        const lines = emptyText.split("\n");
        assert.strictEqual(lines.length, 4);
        const headerParts = lines[0].split(",").map(n=>n.trim()); 
        assert.strictEqual(headerParts.length, 9);
        const lastRowParts = lines[3].split(",").map(n=>n.trim()); 
        assert.strictEqual(lastRowParts.length, 9);
        assert.strictEqual(lines[0].indexOf(`""`), 14);

        assert.ok(iterateRowsSpy.calledOnce); 
        assert.equal(iterateRowsSpy.args[0][0], query);
    });

    test('Flux Query with parameters',async ()=>{
        const fields = [`f"i"el,d1`,"field2","field3"];
        const tags = ["tag1",`t"a"g,2`,"tag3"];
        const ts = new Date();
        ts.setHours(0,0,0,0);

        const tableMeta: FluxTableMetaData = {
           columns:[{label:"time"},{label:"tag1"},{label:`t"a"g,2`},{label:"tag3"},{label:`f"i"el,d1`},{label:"field2"},{label:"field3"}]
        } as any as FluxTableMetaData; 
        const rows = [{
                 values:[returnDateShiftedByMinutes(ts,1).toISOString(),`t"a"gva,lue1`,"tagvalue2","tagvalue3","something","true","12.34"],
                 tableMeta
             },{
                 values:[returnDateShiftedByMinutes(ts,2).toISOString(),`t"a"gva,lue1`,"tagvalue2","tagvalue3","row2","false","0"],
                 tableMeta
             },{
                 values:[returnDateShiftedByMinutes(ts,3).toISOString(),`t"a"gva,lue1`,"tagvalue2","tagvalue3",`s"t"ring,value1`,"true","-95.2"],
                 tableMeta
             }]; 
        
        const myAsyncIterable = createMockAsyncIterator(rows);
        const iterateRowsSpy = sinon.fake.returns(myAsyncIterable);
        client2 = {
            iterateRows: iterateRowsSpy as any,
        } as QueryApi; 
        const query = "#$param1:string = something1 \n #$param2:boolean = true \n #$param3:number = 4.5\n#$param4 = something2 \n SELECT * FROM MEASUREMENTS";
        
        const result = await executeQueryAndCreateDocument(query, server, null, "flux", factory );
        assert.ok(result); 
        assert.equal(result.document.getText() ,FLUX_QUERY_PARAMETER_ERROR );
    });

});