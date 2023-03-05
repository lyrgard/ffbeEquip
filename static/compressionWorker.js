importScripts('https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.min.js')
// This is the compressionWorker that is used to compress the data
// before sending it to the server.
onmessage = function(event) {
    var messageData = event.data
    switch(event.data.process) {
        case "compress":
            var compressedData = LZString.compressToUTF16(messageData.data);
            postMessage(compressedData);
            break;
    }
}