FFBEEquipExternalControl = {
    'ffbeEquipUrl': 'http://localhost:3000/builder.html',
    'iframe': null,
    
    'init': function(iframe) {
        console.log("init");
        return new Promise(function(resolve) {
            FFBEEquipExternalControl.iframe = iframe;
            window.addEventListener("message", FFBEEquipExternalControl.handleMessage);
            iframe.src = FFBEEquipExternalControl.ffbeEquipUrl;
            FFBEEquipExternalControl.listeners.ready.push(resolve)
        });
    },
    
    'selectUnit': function(unitId) {
        console.log("selectUnit " + unitId );
        return new Promise(function(resolve) {
            FFBEEquipExternalControl.iframe.contentWindow.postMessage(JSON.stringify({'type':'selectUnit', 'value':unitId}), '*');
            FFBEEquipExternalControl.listeners.unitSelected.push(resolve)
        });
    },
    
    'selectGoal': function(goal) {
        console.log("selectGoal " + goal );
        return new Promise(function(resolve) {
            FFBEEquipExternalControl.iframe.contentWindow.postMessage(JSON.stringify({'type':'selectGoal', 'value':goal}), '*');
            FFBEEquipExternalControl.listeners.goalChanged.push(resolve)
        });
    },
    
    'build': function() {
        console.log("build");
        return new Promise(function(resolve) {
            FFBEEquipExternalControl.iframe.contentWindow.postMessage(JSON.stringify({'type':'build', 'value':''}), '*');
            FFBEEquipExternalControl.listeners.buildFinished.push(resolve)
        });
    },
    
    'handleMessage': function(message) {
        //if(message.origin === 'https://ffbeEquip.com'){
            let data = JSON.parse(message.data);
            console.log('received Message : ' + data.type);
            FFBEEquipExternalControl.listeners[data.type].forEach(f => f(data.value));
            FFBEEquipExternalControl.listeners[data.type] = [];
        //}
    },
    
    'listeners': {
        'ready': [],
        'unitSelected': [],
        'goalChanged': [],
        'buildFinished': [],
    },
    
    
}