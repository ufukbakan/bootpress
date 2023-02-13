function getOrThrow(data, error){
    if(data === null || data === undefined){
        throw error;
    }else{
        return data;
    }
}

module.exports = {
    getOrThrow
}