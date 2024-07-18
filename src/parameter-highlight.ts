import * as vscode from 'vscode';
import { PARAMETER_REGEX_GLOBAL } from './constants';
let timeout: NodeJS.Timeout | undefined = undefined;

const nameDecorationType = vscode.window.createTextEditorDecorationType({
    borderWidth: '1px',
    borderStyle: 'none none solid none',
    overviewRulerColor: 'blue',
    overviewRulerLane: vscode.OverviewRulerLane.Right,

    light: {
        // this color will be used in light color themes
        borderColor: 'darkblue'
    },
    dark: {
        // this color will be used in dark color themes
        borderColor: 'lightblue'
    }
});

const typeDecorationType = vscode.window.createTextEditorDecorationType({
    borderWidth: '1px',
    borderStyle: 'none none solid none',
    overviewRulerColor: 'red',
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    light: {
        // this color will be used in light color themes
        borderColor: 'darkred'
    },
    dark: {
        // this color will be used in dark color themes
        borderColor: 'lightred'
    }
});

const valueDecorationType = vscode.window.createTextEditorDecorationType({
    borderWidth: '1px',
    borderStyle: 'none none solid none',
    overviewRulerColor: 'green',
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    light: {
        // this color will be used in light color themes
        borderColor: 'darkgreen'
    },
    dark: {
        // this color will be used in dark color themes
        borderColor: 'lightgreen'
    }
});

const updateDecorations = (activeEditor: vscode.TextEditor) => {
    if (!activeEditor) {
        return;
    }
    
    const text = activeEditor.document.getText();
    const parameter_names: vscode.DecorationOptions[] = [];
    const parameter_types: vscode.DecorationOptions[] = [];
    const parameter_values: vscode.DecorationOptions[] = [];
    let match: RegExpExecArray | null;

    while ((match = PARAMETER_REGEX_GLOBAL.exec(text))) {
        const idx_name_line_start = match[0].indexOf(match[1]);
        const idx_name = idx_name_line_start + match.index;
        const startPos_name = activeEditor.document.positionAt(idx_name);
        const endPos_name = activeEditor.document.positionAt(idx_name + match[1].length);
        parameter_names.push({ range: new vscode.Range(startPos_name, endPos_name), hoverMessage: 'Parameter **' + match[1] + '**' });

        if(match[3]){
            const idx_type = match[0].indexOf(match[3], idx_name_line_start) + match.index;
            const startPos_type = activeEditor.document.positionAt(idx_type);
            const endPos_type = activeEditor.document.positionAt(idx_type + match[3].length);
            parameter_types.push({ range: new vscode.Range(startPos_type, endPos_type), hoverMessage: 'Type **' + match[3] + '**' });
        }

        const idx_colon = match[0].indexOf("=");
        const idx_value = match[0].indexOf(match[4], idx_colon) + match.index;
        const startPos_value = activeEditor.document.positionAt(idx_value);
        const endPos_value = activeEditor.document.positionAt(idx_value + match[4].length);
        parameter_values.push({ range: new vscode.Range(startPos_value, endPos_value), hoverMessage: 'Value **' + match[4] + '**' });

    }
    
    activeEditor.setDecorations(nameDecorationType, parameter_names);
    activeEditor.setDecorations(typeDecorationType, parameter_types);
    activeEditor.setDecorations(valueDecorationType, parameter_values);
}; 

const cancelTimeout = ()=>{
    if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
    }
};

const triggerUpdateDecorations = (activeEditor: vscode.TextEditor | undefined, throttle:boolean = false) => {
    cancelTimeout();

    if(activeEditor && (activeEditor.document.languageId === "sql" || activeEditor.document.languageId === "influxql")){
        if (throttle) {
            timeout = setTimeout(()=>{updateDecorations(activeEditor);} , 500);
        } else {
            updateDecorations(activeEditor);
        }
    }
};

export {triggerUpdateDecorations,cancelTimeout}; 