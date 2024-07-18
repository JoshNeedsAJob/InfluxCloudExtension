const ADD_SERVER_LABEL = "==>Add Server<==";
const REMOVE_SERVER_LABEL = "==>Remove Server<==";
const NO_SELECTION_MESSAGE = "<no influx server selected>"; 
const FLUX_QUERY_PARAMETER_ERROR = "Flux queries are not compatable with named parameters.";
const STOP_ICON_DARK = "resources/dark/cancel-red-sm.png";
const STOP_ICON_LIGHT = "resources/light/cancel-red-sm.png";

const PARAMETER_REGEX = /\#\$([\w\d]+)[ \t]*(\:[ \t]*(string|number|boolean))?[ \t]*\=[ \t]*([^\n]+)/;
const PARAMETER_REGEX_GLOBAL = /\#\$([\w\d]+)[ \t]*(\:[ \t]*(string|number|boolean))?[ \t]*\=[ \t]*([^\n]+)/g;

type InfluxLanguages = 'sql' | 'influxql' | 'flux';

export {ADD_SERVER_LABEL, REMOVE_SERVER_LABEL, NO_SELECTION_MESSAGE,FLUX_QUERY_PARAMETER_ERROR,STOP_ICON_DARK, STOP_ICON_LIGHT,PARAMETER_REGEX,PARAMETER_REGEX_GLOBAL};

export type { InfluxLanguages };