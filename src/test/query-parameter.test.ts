import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { QueryParameter, transformQueryParametersToInflux } from '../query-parameter';
// import * as myExtension from '../extension';

suite('Query Parameter Test Suite', () => {
	test('Transform empty Parameters', () => {
        const result = transformQueryParametersToInflux(null);
        assert.strictEqual(result, undefined);
	});

    test('Transform Several Parameters', () => {
        const myParameters: QueryParameter[] = [{
            name:"param_string",
            type:"string",
            value:"My String"
        },{
            name:"param_bool",
            type:"boolean",
            value:true
        },{
            name:"param_num",
            type:"number",
            value:1.23
        },{
            name:"param_unknown",
            type:"some other thing",
            value: "something unknown"
        }];

        const result = transformQueryParametersToInflux(myParameters);
        assert.ok(result);
        assert.ok(result["param_string"]);
        assert.ok(result["param_bool"]);
        assert.ok(result["param_num"]);
        assert.ok(result["param_unknown"]);
        assert.ok(!result["somethingelse"]);
        assert.strictEqual(result["param_string"], myParameters[0].value);
        assert.strictEqual(result["param_bool"], myParameters[1].value);
        assert.strictEqual(result["param_num"], myParameters[2].value);
        assert.strictEqual(result["param_unknown"], myParameters[3].value);
        assert.strictEqual(result["somethingelse"], undefined);
	});
});
