const ADD_SERVER_LABEL = "==>Add Server<==";
const REMOVE_SERVER_LABEL = "==>Remove Server<==";
const NO_SELECTION_MESSAGE = "<no influx server selected>"; 
const FLUX_QUERY_PARAMETER_ERROR = "Flux queries are not compatable with named parameters.";

type InfluxLanguages = 'sql' | 'influxql' | 'flux';

export {ADD_SERVER_LABEL, REMOVE_SERVER_LABEL, NO_SELECTION_MESSAGE,FLUX_QUERY_PARAMETER_ERROR};

export type { InfluxLanguages };