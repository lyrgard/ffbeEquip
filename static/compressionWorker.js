// This is the compressionWorker that is used to compress the data
// before sending it to the server.
onmessage = function(event) {
    var messageData = JSON.parse(event.data);
    switch(messageData.type) {
        case "compress":
            var compressedData = LZString.compressToUTF16(JSON.stringify(messageData.data));
            postMessage(JSON.stringify({"type":"compressed","data":compressedData}));
            break;
    }
}