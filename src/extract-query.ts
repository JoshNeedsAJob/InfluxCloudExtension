import { QueryParameter } from "./query-parameter";


const extractQuery = (rawQuery:string) => {
    const rawLines = rawQuery.split("\n").map(n=>n.trim());
    const parameters: QueryParameter[] = [];
    const resultLines:string [] = [];

    const parameterRegex = /\#\$([\w\d]+)[ \t]*(\:[ \t]*(string|number|boolean))?[ \t]*\=[ \t]*([^\n]+)/;

    for(const l of rawLines){
        
        if(parameterRegex.test(l)){
            const regexMatch = parameterRegex.exec(l);
            if(regexMatch && regexMatch[1]){
                const myName = regexMatch[1]?.trim();
                const myType = regexMatch[3]?.trim()?.toLowerCase() || 'string';
                const myValue = getValidParameterValue(regexMatch[4], myType);
                const newParam:QueryParameter ={name:myName,type:myType, value:myValue};
                if(isParameterValid(newParam)){
                    parameters.push(newParam);
                }
            }
        } else {
            resultLines.push(l); 
        }
    }

    return {queryText: resultLines.join("\n"), parameters: parameters} ;

};

const isParameterValid = (myParameter:QueryParameter) => {
    return myParameter.name && myParameter.type;
};

const getValidParameterValue = (value:string | null | undefined, parameterType:string) => {
    value = value?.trim(); 
    if(parameterType === 'boolean'){
        return getValidBoolean(value); 
    }
    else if(parameterType === 'number') {
        return getValidNumber(value);
    }
    return value ?? ''; 
};

const getValidNumber = (value:string | null | undefined)=>{
    const newNumber = Number(value ?? '');
    return newNumber; 
};

const getValidBoolean = (value:string | null | undefined)=>{
    const newBool = Boolean(value ?? '');
    return newBool; 
};

export {extractQuery}; 