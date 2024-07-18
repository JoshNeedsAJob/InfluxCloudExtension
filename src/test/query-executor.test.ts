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
import { createMockAsyncIterator, multiResultFake, returnDateShiftedByMinutes, returnDateShiftedByMinutesAsISOSting, returnDateShiftedByMinutesAsNumber } from './test-utils';
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

    const ts = new Date();
    ts.setHours(0,0,0,0);
    const fields = [`f"i"el,d1`,"field2","field3"];
    const tags = ["tag1",`t"a"g,2`,"tag3"];
    const getPointValues = ()=>{
        const pointValues: PointValues[] = [{
            getFieldNames: sinon.fake.returns(fields),
            getTagNames: sinon.fake.returns(tags),
            getTimestamp: sinon.fake.returns(returnDateShiftedByMinutesAsNumber(ts,1)),
            getFieldType: multiResultFake<PointFieldType>(['string','boolean','float']),
            getStringField: sinon.fake.returns("stringvalue1"),
            getBooleanField: sinon.fake.returns(true),
            getFloatField: sinon.fake.returns(12.341),
            getTag: multiResultFake<string>(["tagvalue1-1","tagvalue2-1","tagvalue3-1"])
        } as any as PointValues,{
            getFieldNames: sinon.fake.returns(fields),
            getTagNames: sinon.fake.returns(tags),
            getTimestamp: sinon.fake.returns(returnDateShiftedByMinutesAsNumber(ts,2)),
            getFieldType: multiResultFake<PointFieldType>(['string','boolean','float']),
            getStringField: sinon.fake.returns("stringvalue2"),
            getBooleanField: sinon.fake.returns(false),
            getFloatField: sinon.fake.returns(0.2),            
            getTag: multiResultFake<string>([`t"a"gva,lue1-2`,"tagvalue2-2","tagvalue3-2"])
        } as any as PointValues,{
            getFieldNames: sinon.fake.returns(fields),
            getTagNames: sinon.fake.returns(tags),
            getTimestamp: sinon.fake.returns(returnDateShiftedByMinutesAsNumber(ts,3)),
            getFieldType: multiResultFake<PointFieldType>(['string','boolean','float']),
            getStringField: sinon.fake.returns(`s"t"ring,value3`),
            getBooleanField: sinon.fake.returns(true),
            getFloatField: sinon.fake.returns(-95.3),            
            getTag: multiResultFake<string>([`t"a"gva,lue1-3`,"tagvalue2-3","tagvalue3-3"])
        } as any as PointValues,{
            getFieldNames: sinon.fake.returns(fields),
            getTagNames: sinon.fake.returns(tags),
            getTimestamp: sinon.fake.returns(returnDateShiftedByMinutesAsNumber(ts,4)),
            getFieldType: multiResultFake<PointFieldType>(['string','boolean','float']),
            getStringField: sinon.fake.returns(`s"t"ring,value4`),
            getBooleanField: sinon.fake.returns(true),
            getFloatField: sinon.fake.returns(-95.4),            
            getTag: multiResultFake<string>([`t"a"gva,lue1-4`,"tagvalue2-4","tagvalue3-4"])
        } as any as PointValues,{
            getFieldNames: sinon.fake.returns(fields),
            getTagNames: sinon.fake.returns(tags),
            getTimestamp: sinon.fake.returns(returnDateShiftedByMinutesAsNumber(ts,5)),
            getFieldType: multiResultFake<PointFieldType>(['string','boolean','float']),
            getStringField: sinon.fake.returns(`s"t"ring,value5`),
            getBooleanField: sinon.fake.returns(true),
            getFloatField: sinon.fake.returns(-95.5),            
            getTag: multiResultFake<string>([`t"a"gva,lue1-5`,"tagvalue2-5","tagvalue3-5"])
        } as any as PointValues];
        return pointValues;
    };
 
    const simplePointValues: PointValues[] = [{
        getFieldNames: sinon.fake.returns(["field1"]),
        getTagNames: sinon.fake.returns(["tag1"]),
        getTimestamp: sinon.fake.returns(returnDateShiftedByMinutes(ts,1)),
        getFieldType: sinon.fake.returns("string"),
        getStringField: sinon.fake.returns("stringvalue1"),
        getTag: sinon.fake.returns("tagvalue1")
    } as any as PointValues]; 

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
        const result = await executeQueryAndCreateDocument(undefined, null, null, "sql", factory, "csv",0 );
        assert.ok(result); 
        const emptyText = result.document.getText();
        assert.equal(emptyText, "Empty Result");
    });

    test('Simple SQL Query',async ()=>{
        const queryPointsSpy = sinon.fake.returns(getPointValues().slice(0,3));
        client3 = {
            queryPoints: queryPointsSpy as any,
            close: sinon.fake as any
        } as InfluxDBClient; 
        const query = "SELECT * FROM MEASUREMENTS";
        
        const result = await executeQueryAndCreateDocument(query, server, null, "sql", factory, "csv",0 );
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
        assert.ok(lines[1].indexOf("stringvalue1") >0);
        assert.ok(lines[2].indexOf("stringvalue2") >0);
        assert.ok(lines[3].indexOf(`"s""t""ring,value3"`) >0);
    });

    test('SQL Query with parameters',async ()=>{
        const queryPointsSpy = sinon.fake.returns(simplePointValues);
        client3 = {
            queryPoints: queryPointsSpy as any,
            close: sinon.fake as any
        } as InfluxDBClient; 
        const query = "#$param1:string = something1 \n #$param2:boolean = true \n #$param3:number = 4.5\n#$param4 = something2 \n SELECT * FROM MEASUREMENTS";
        
        const result = await executeQueryAndCreateDocument(query, server, null, "sql", factory, "csv",0 );
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
        const queryPointsSpy = sinon.fake.returns(getPointValues().slice(0,3));
        client3 = {
            queryPoints: queryPointsSpy as any,
            close: sinon.fake as any
        } as InfluxDBClient; 
        const query = "SELECT * FROM MEASUREMENTS";
        
        const result = await executeQueryAndCreateDocument(query, server, null, "influxql", factory, "csv",0 );
        assert.ok(result); 
        const emptyText = result.document.getText();
        const lines = emptyText.split("\n");
        assert.strictEqual(lines.length, 4);
        const headerParts = lines[0].split(",").map(n=>n.trim()); 
        assert.strictEqual(headerParts.length, 9);
        assert.equal(lines[3],`${returnDateShiftedByMinutesAsNumber(ts,3)},\tt"a"gva,lue1-3,\ttagvalue2-3,\ttagvalue3-3,\t"s""t""ring,value3",\ttrue,\t-95.3`);
        const lastRowParts = lines[3].split(",").map(n=>n.trim()); 
        assert.strictEqual(lastRowParts.length, 9);
        assert.strictEqual(lines[0].indexOf(`""`), 15);

        assert.ok(queryPointsSpy.calledOnce); 
        assert.equal(queryPointsSpy.args[0][2].type, "influxql");

        assert.ok(lines[1].indexOf("stringvalue1") >0);
        assert.ok(lines[2].indexOf("stringvalue2") >0);
        assert.ok(lines[3].indexOf(`"s""t""ring,value3"`) >0);
    });

    test('InfluxQL Query with parameters',async ()=>{
        const queryPointsSpy = sinon.fake.returns(simplePointValues);
        client3 = {
            queryPoints: queryPointsSpy as any,
            close: sinon.fake as any
        } as InfluxDBClient; 
        const query = "#$param1:string = something1 \n #$param2:boolean = true \n #$param3:number = 4.5\n#$param4 = something2 \n SELECT * FROM MEASUREMENTS";
        
        const result = await executeQueryAndCreateDocument(query, server, null, "influxql", factory, "csv",0 );
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
        const tableMeta: FluxTableMetaData = {
           columns:[{label:"time"},{label:"tag1"},{label:`t"a"g,2`},{label:"tag3"},{label:`f"i"el,d1`},{label:"field2"},{label:"field3"}]
        } as any as FluxTableMetaData; 
        const rows = [{
                 values:[returnDateShiftedByMinutesAsISOSting(ts,1),`t"a"gva,lue1`,"tagvalue2","tagvalue3","something","true","12.34"],
                 tableMeta
             },{
                 values:[returnDateShiftedByMinutesAsISOSting(ts,2),`t"a"gva,lue1`,"tagvalue2","tagvalue3","row2","false","0"],
                 tableMeta
             },{
                 values:[returnDateShiftedByMinutesAsISOSting(ts,3),`t"a"gva,lue1`,"tagvalue2","tagvalue3",`s"t"ring,value1`,"true","-95.2"],
                 tableMeta
             }]; 
        
        const myAsyncIterable = createMockAsyncIterator(rows);
        const iterateRowsSpy = sinon.fake.returns(myAsyncIterable);
        client2 = {
            iterateRows: iterateRowsSpy as any,
        } as QueryApi; 
        const query = "SELECT * FROM MEASUREMENTS";
        
        const result = await executeQueryAndCreateDocument(query, server, null, "flux", factory, "csv",0 );
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
        const tableMeta: FluxTableMetaData = {
           columns:[{label:"time"},{label:"tag1"},{label:`t"a"g,2`},{label:"tag3"},{label:`f"i"el,d1`},{label:"field2"},{label:"field3"}]
        } as any as FluxTableMetaData; 
        const rows = [{
                 values:[returnDateShiftedByMinutesAsISOSting(ts,1),`t"a"gva,lue1`,"tagvalue2","tagvalue3","something","true","12.34"],
                 tableMeta
             },{
                 values:[returnDateShiftedByMinutesAsISOSting(ts,2),`t"a"gva,lue1`,"tagvalue2","tagvalue3","row2","false","0"],
                 tableMeta
             },{
                 values:[returnDateShiftedByMinutesAsISOSting(ts,3),`t"a"gva,lue1`,"tagvalue2","tagvalue3",`s"t"ring,value1`,"true","-95.2"],
                 tableMeta
             }]; 
        
        const myAsyncIterable = createMockAsyncIterator(rows);
        const iterateRowsSpy = sinon.fake.returns(myAsyncIterable);
        client2 = {
            iterateRows: iterateRowsSpy as any,
        } as QueryApi; 
        const query = "#$param1:string = something1 \n #$param2:boolean = true \n #$param3:number = 4.5\n#$param4 = something2 \n SELECT * FROM MEASUREMENTS";
        
        const result = await executeQueryAndCreateDocument(query, server, null, "flux", factory, "csv",0 );
        assert.ok(result); 
        assert.equal(result.document.getText() ,FLUX_QUERY_PARAMETER_ERROR );
    });

    test('SQL Query with limited results',async ()=>{
        const queryPointsSpy = sinon.fake.returns(getPointValues());
        client3 = {
            queryPoints: queryPointsSpy as any,
            close: sinon.fake as any
        } as InfluxDBClient; 
        const query = "SELECT * FROM MEASUREMENTS";
        
        const result = await executeQueryAndCreateDocument(query, server, null, "sql", factory, "csv",3 );
        assert.ok(result); 
        const emptyText = result.document.getText();
        const lines = emptyText.split("\n");
        assert.strictEqual(lines.length, 4);
        assert.ok(lines[1].indexOf("stringvalue1") >0);
        assert.ok(lines[2].indexOf("stringvalue2") >0);
        assert.ok(lines[3].indexOf(`"s""t""ring,value3"`) >0);
    });

    test('SQL Query with line protocol results',async ()=>{
        const queryPointsSpy = sinon.fake.returns(getPointValues());
        client3 = {
            queryPoints: queryPointsSpy as any,
            close: sinon.fake as any
        } as InfluxDBClient; 
        const query = "SELECT * FROM MEASUREMENTS";
        
        const result = await executeQueryAndCreateDocument(query, server, null, "sql", factory, "lineprotocol",0 );
        assert.ok(result); 
        const emptyText = result.document.getText();
        const lines = emptyText.split("\n");
        assert.strictEqual(lines.length, 5);
        assert.strictEqual(lines[0], `measurement,tag1=tagvalue1-1,t"a"g,2=tagvalue2-1,tag3=tagvalue3-1 f"i"el,d1=stringvalue1,field2=true,field3=12.341 ${returnDateShiftedByMinutesAsNumber(ts,1)}`);
        assert.strictEqual(lines[4], `measurement,tag1=t"a"gva,lue1-5,t"a"g,2=tagvalue2-5,tag3=tagvalue3-5 f"i"el,d1="s""t""ring,value5",field2=true,field3=-95.5 ${returnDateShiftedByMinutesAsNumber(ts,5)}`);
    });

    test('SQL Query with weird csv results',async ()=>{
        const queryPointsSpy = sinon.fake.returns(getPointValues());
        client3 = {
            queryPoints: queryPointsSpy as any,
            close: sinon.fake as any
        } as InfluxDBClient; 
        const query = "SELECT * FROM MEASUREMENTS";
        
        const result = await executeQueryAndCreateDocument(query, server, null, "sql", factory, "weirdcsv",0 );
        assert.ok(result); 
        const emptyText = result.document.getText();
        const lines = emptyText.split("\n");
        assert.strictEqual(lines.length, 9);
        assert.strictEqual(lines[0], `#group,false,false,true,true,false,false,false,true,true,true`);
        assert.strictEqual(lines[1], `#datatype,string,long,dateTime,string,string,string,string,string,boolean,float`);
        assert.strictEqual(lines[2], `#default,,,,,,,,,,`);
        assert.strictEqual(lines[3], `,result,table,_time,_measurement,tag1,"t""a""g,2",tag3,"f""i""el,d1",field2,field3`);
        assert.strictEqual(lines[8], `,,0,${returnDateShiftedByMinutesAsNumber(ts,5)},measurement,t"a"gva,lue1-5,tagvalue2-5,tagvalue3-5,"s""t""ring,value5",true,-95.5`);
    });

    test('SQL Query with weird csv results and limited lines',async ()=>{
        const queryPointsSpy = sinon.fake.returns(getPointValues());
        client3 = {
            queryPoints: queryPointsSpy as any,
            close: sinon.fake as any
        } as InfluxDBClient; 
        const query = "SELECT * FROM MEASUREMENTS";
        
        const result = await executeQueryAndCreateDocument(query, server, null, "sql", factory, "weirdcsv",3 );
        assert.ok(result); 
        const emptyText = result.document.getText();
        const lines = emptyText.split("\n");
        assert.strictEqual(lines.length, 7);
    });

});