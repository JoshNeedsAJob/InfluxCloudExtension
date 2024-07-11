import { QParamType } from "@influxdata/influxdb3-client";

interface QueryParameter {
    name:string;
    type:string; 
    value:string|number|boolean; 
}

const transformQueryParametersToInflux = (queryParameters:QueryParameter[] | null | undefined)=>{
    if(queryParameters?.length){
        const result: Record<string, QParamType> = {};

        for( const p of queryParameters){
            result[p.name] = p.value; 
        }

        return result; 
    }
    return undefined;
    
};

export type { QueryParameter };

export {transformQueryParametersToInflux}; 