//Instantiate Websocket module
const WebSocket = require('ws');

//WebSocketAPI Address
var wsAddress = 'wss://apifoxbitprodlb.alphapoint.com/WSGateway/';

//Instantiate SleepModule
var sleep = require('system-sleep');

//Setup WebSocket client Address
var ws = new WebSocket(wsAddress);

//Flag Authenticated
var authenticated = false;

//User & Password
var userLogin = "";
var userPass = "";
var userId = "0";
var sessionToken = "";

//Wait PromptInformation    
var stdin2FA = process.openStdin();

//side variable = Buy/Sell
var side = 1;

//Message Frame
var messageFrame = {   

    "m":0,		//MessageType ( 0_Request / 1_Reply / 2_Subscribe / 3_Event / 4_Unsubscribe / Error )
    "i":0,		//Sequence Number
    "n":"",		//Function Name
    "o":""		//Payload
    
};

//WebSocket Event Area
//Event Open Connection 
ws.on('open', function open() { 
   
    consoleMessage('------------------------------------------------------------------------','startup');
    consoleMessage('Got connection','open.event');

    //Start first command
    WebAuthenticateUser(messageFrame);

    consoleMessage('End connection','open.event');

});

//Event Receiving Message
ws.on('message', function incoming(data) {

    dealMessage(messageFrame, data);

});

//Event Error Message
ws.on('error', function(error) {
    
    consoleMessage('WebService','error! ' + error);
    
});

//Event Close Message
ws.on('close', function() {
    
    consoleMessage('WebService','close! ');

    WebAuthenticateUser(messageFrame);
   
});

/*
//Event End Message
ws.on('end', function(data) {
    
    consoleMessage('WebService','end! ' + data);
    
});
*/

//Function AskUserInfo
function AskPrompt(message){

    consoleMessage(message);

	stdin.addListener("data", function(d) {
                
        var ret = d.toString().trim();

        consoleMessage('!AskPrompt', ret);
        
        return ret;

    });

}

//Function DealMessage
function dealMessage(frame, message){
        
    var ret = JSON.parse(message);

    if (ret.n == "WebAuthenticateUser"){

    	consoleMessage('<-' + ret.n, JSON.stringify(ret));

        if (authenticated == false){

            Authenticate2FA(frame);

        }

    }else if (ret.n == "GetUserInfo"){
        
    	consoleMessage('<-' + ret.n, JSON.stringify(ret));
    
    }else if (ret.n == 'SendOrder'){

    	consoleMessage('<-' + ret.n, JSON.stringify(ret));

    }else if(ret.n == 'Authenticate2FA') {
        
        authenticated = true;

        consoleMessage('<-' + ret.n, JSON.stringify(ret));

        var paramO;
        if (ret.o != undefined){
            paramO = JSON.parse(ret.o);

            sessionToken = JSON.stringify(paramO.SessionToken);
            userId = JSON.stringify(paramO.UserId);
    
            consoleMessage('<- sessionToken', sessionToken);
    
            consoleMessage('<- userId', userId);
    
            Authenticate2FA(frame);

        }
                
    }else{

    	consoleMessage('<-' + ret.n, JSON.stringify(ret));

    }

}

//Startup Function
function startTrading(frame){

	SendOrder(frame);

}

//Function WebAuthenticateUser
function WebAuthenticateUser(frame){
    
    frame.n = "WebAuthenticateUser";    
    
    var requestPayload = {"UserName": userLogin, "Password": userPass};

    frame.o = JSON.stringify(requestPayload);

    consoleMessage(frame.n, JSON.stringify(frame));

    ws.send(JSON.stringify(frame), function ack(error) {

        if (error != undefined){

    		consoleMessage('Error', JSON.stringify(error));

        }

    });

}

//Function Authenticate2FA
function Authenticate2FA(frame){
    
    frame.n = "Authenticate2FA";    

    var twoFA = "0000";
    
    if (sessionToken == ""){

        consoleMessage(frame.n, 'Enter with 2FA Code:');

        stdin2FA.addListener("data", function(d) {
            
            twoFA = d.toString().trim();

            if (twoFA != "0000"){

                var requestPayload = { "Code": twoFA };
            
                frame.o = JSON.stringify(requestPayload);

                consoleMessage(frame.n, JSON.stringify(frame));
            
                ws.send(JSON.stringify(frame), function ack(error) {

                    if (error != undefined){

                        console.log('<- Authenticate2FA.error: (' + error + ')');

                    }

                });
        
            }

        });

    }else{

        consoleMessage('Already logged! SessionToken + UserId', sessionToken + ' + ' + userId);

        frame.n = "WebAuthenticateUser";

        var requestPayload = { "UserId": userId , "SessionToken": JSON.parse(sessionToken) };
            
        frame.o = JSON.stringify(requestPayload);

        consoleMessage(frame.n, JSON.stringify(frame));

        ws.send(JSON.stringify(frame), function ack(error) {

            if (error != undefined){

                console.log('<- Authenticate2FA.error: (' + error + ')');
                
            }

        });
        
	    GetUserInfo(frame);
        
    }

    

}

//Function SendOrder
function SendOrder(frame){

    frame.n = "SendOrder";

    var requestPayload = {

            "AccountId": 84437,
            "ClientOrderId": 0,
            "Quantity": 0.00001,
            "DisplayQuantity": 0,
            "UseDisplayQuantity": true,
            "LimitPrice": 0,
            "OrderIdOCO": 0,
            "OrderType": 1,     //ORDEM A MERCADO = 1
            "PegPriceType": 1,
            "InstrumentId": 1,
            "TrailingAmount": 1.0,
            "LimitOffset": 2.0,
            "Side": side,
            "StopPrice": 0,
            "TimeInForce": 1,
            "OMSId": 1,
    
    };
    
    frame.o = JSON.stringify(requestPayload);

    if (side == 0){

        side = 1;

    }else{

        side = 0;

    }

    console.log('\r\n-> ' + JSON.stringify(frame));

    ws.send(JSON.stringify(frame), function ack(error) {

        ws = new WebSocket('wss://apifoxbitprod.alphapoint.com/WSGateway/')
        
        console.log('SendOrder.error: (' + error + ')');

    });    

}


function CancelOrder(frame, OrderId){

    frame.n = "CancelOrder";

    requestPayload2 = {
        "OMSId": 1,
        "AccountId":81
    };
    
    frame.o = JSON.stringify(requestPayload2);

    ws.send(JSON.stringify(frame), function ack(error) {
        console.log('CancelOrder.error: (' + error + ')');
    });    
    
}

function GetOrderHistory(frame){

    frame.n = "GetOrderHistory";

    requestPayload2 = {
        "OMSId": 1,
        "AccountId":81
    };
    
    frame.o = JSON.stringify(requestPayload2);

    ws.send(JSON.stringify(frame), function ack(error) {

        console.log('GetOrderHistory.error: (' + error + ')');
        
    });    
    
}

function GetOpenOrders(frame){

    frame.n = "GetOpenOrders";

    requestPayload2 = {
        "AccountId":81,
        "OMSId": 1
    };
    
    frame.o = JSON.stringify(requestPayload2);

    ws.send(JSON.stringify(frame), function ack(error) {

        console.log('GetOpenOrders.error: (' + error + ')');

    });    

}

function GetUserInfo(frame){

    frame.n = "GetUserInfo";

    requestPayload2 = {
    };
    
    frame.o = JSON.stringify(requestPayload2);

    ws.send(JSON.stringify(frame), function ack(error) {

        console.log('GetUserInfo.error: (' + error + ')');

    });    

}

function GetUserConfig(frame){

    frame.n = "GetUserConfig";

    requestPayload2 = {

    };
    
    frame.o = JSON.stringify(requestPayload2);

    ws.send(JSON.stringify(frame), function ack(error) {

        console.log('GetUserInfo.error: (' + error + ')');

    });    

}

//Function Console
function consoleMessage(prefix, sulfix){

    console.log('\r\n' + prefix + ': (' +sulfix + ')\r\n'); 

}