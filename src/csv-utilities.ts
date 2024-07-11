const cleanStringForCSV = (value:string | null | undefined) =>{
    value = value ?? ''; 
    value = value.trim(); 
    value = value.replaceAll(`"`, `""`);
    if(value.includes(",")){
        value = `"${value}"`;
    }                   
    return value; 
};

export {cleanStringForCSV}; 