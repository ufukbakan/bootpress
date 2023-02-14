function getOrThrow(data, error){
    if(data === null || data === undefined){
        throw error;
    }else{
        return data;
    }
}

function getOrElse(data, defaultValue){
    if(data === null || data === undefined){
        return defaultValue;
    }else{
        return data;
    }
}

module.exports = {
    getOrThrow,
    getOrElse
}