const ADD_SERVER_LABEL = "==>Add Server<==";
const REMOVE_SERVER_LABEL = "==>Remove Server<==";
const NO_SELECTION_MESSAGE = "<no influx server selected>"; 
const FLUX_QUERY_PARAMETER_ERROR = "Flux queries are not compatable with named parameters.";
const STOP_ICON_DARK = "resources/dark/cancel-red-sm.png";
const STOP_ICON_LIGHT = "resources/light/cancel-red-sm.png";

type InfluxLanguages = 'sql' | 'influxql' | 'flux';

export {ADD_SERVER_LABEL, REMOVE_SERVER_LABEL, NO_SELECTION_MESSAGE,FLUX_QUERY_PARAMETER_ERROR,STOP_ICON_DARK, STOP_ICON_LIGHT};

export type { InfluxLanguages };