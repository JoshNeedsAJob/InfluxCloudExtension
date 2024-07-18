import * as sinon from 'sinon';

const multiResultFake = <T>(values: T[])=>{
    return sinon.fake((...params)=>{
        return values.shift();
    });
};

const returnDateShiftedByMinutes = (d:Date, minutes:number) => {
    const result = new Date(d);
    result.setMinutes(d.getMinutes() + minutes);
    return result; 
};

const returnDateShiftedByMinutesAsISOSting = (d:Date, minutes:number) => {
  return returnDateShiftedByMinutes(d, minutes).toISOString(); 
};

const returnDateShiftedByMinutesAsNumber = (d:Date, minutes:number) => {
  return returnDateShiftedByMinutes(d, minutes).getTime(); 
};

const createMockAsyncIterator = <T>(values:T[])=>{

    const result = {
        [Symbol.asyncIterator]() {
            let i = 0;
            return {
              next() {
                if (values.length > 0) {
                  return Promise.resolve({ value: values.shift(), done: false });
                }
                return Promise.resolve({ done: true });
              }
            };
          }
    };
    return result; 
};

export {multiResultFake, returnDateShiftedByMinutes, createMockAsyncIterator,returnDateShiftedByMinutesAsNumber,returnDateShiftedByMinutesAsISOSting};