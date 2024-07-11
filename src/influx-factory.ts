import { InfluxDB, QueryApi } from "@influxdata/influxdb-client";
import { InfluxDBClient } from "@influxdata/influxdb3-client";
import { ServerDetails } from "./server-details";

interface IInfluxFactory {
    getClient3: (server:ServerDetails)=>InfluxDBClient;
    getClient2: (server:ServerDetails)=>QueryApi;
}

class InfluxFactory implements IInfluxFactory {
    getClient3 = (server:ServerDetails)=>{
        const client: InfluxDBClient = new InfluxDBClient({host: server.serverAddress, token: server.token, database: server.bucket}); 
        return client; 
    };

    getClient2 = (server:ServerDetails) => {
        const queryApi = new InfluxDB({url:server.serverAddress, token: server.token}).getQueryApi(server.orgId);
        return queryApi;
    };
    
}

export {InfluxFactory};
export type {IInfluxFactory};