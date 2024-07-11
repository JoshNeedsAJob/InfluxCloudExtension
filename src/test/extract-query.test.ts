import * as assert from 'assert';
import { extractQuery } from '../extract-query';

suite('Extract Query Test Suite', () => {
	test('No Parameters Empty Query', () => {

        const rawQuery = "";
        const result = extractQuery(rawQuery);

        assert.equal(result.queryText, rawQuery);
        assert.equal(result.parameters.length, 0);

	});

    test('No Parameters Multi Line Query', () => {

        const rawQuery = "\n#Here is a comment\nSELECT * FROM Something\n\n";
        const result = extractQuery(rawQuery);

        assert.equal(result.queryText, rawQuery);
        assert.equal(result.parameters.length, 0);

	});

    test('Some Parameters Multi Line Query', () => {

        const rawQuery = `

#$param1 = myparam1
#$param2:string = myparam2  
#$param3:number = 12.34 
 #$param4:boolean = true 
#$param1 = myparam1override 

SELECT * FROM MEASUREMENT
WHERE SOMETHING =$param3
# Here is a comment
        `;
        
        const processedQuery = `


SELECT * FROM MEASUREMENT
WHERE SOMETHING =$param3
# Here is a comment
`;

        const result = extractQuery(rawQuery);

        assert.equal(result.queryText, processedQuery);
        assert.equal(result.parameters.length, 5);

        const p1a = result.parameters.find(n=>n.name === "param1");
        const p2 = result.parameters.find(n=>n.name === "param2");
        const p3 = result.parameters.find(n=>n.name === "param3");
        const p4 = result.parameters.find(n=>n.name === "param4");
        const p1b = result.parameters.reverse().find( n=>n.name === "param1");

        assert.ok(p1a);
        assert.ok(p2);
        assert.ok(p3);
        assert.ok(p4);
        assert.ok(p1b);

        assert.equal(p1a.type,"string");
        assert.equal(p2.type,"string");
        assert.equal(p3.type,"number");
        assert.equal(p4.type,"boolean");
        assert.equal(p1b.type,"string");

        assert.equal(p1a.value ,"myparam1");
        assert.equal(p2.value,"myparam2");
        assert.equal(p3.value,12.34);
        assert.equal(p4.value,true);
        assert.equal(p1b.value,"myparam1override");

	});
});
