/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Hi, what is your ID';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Hello World!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/*      ADDED CODE  */
const RecordVisitorIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RecordVisitorIntent';
    },
    async handle(handlerInput) {
        const serviceClientFactory = handlerInput.serviceClientFactory;
        const deviceId = handlerInput.requestEnvelope.context.System.device.deviceId;
        
        const id = handlerInput.requestEnvelope.request.intent.slots.ID.value;
        var speakOutput; //= "Thanks, I'll remember your contact information, nick."; 
        
        let userTimeZone;
        /*=  Date and time vistor entered office*/
        
        try {
            const upsServiceClient = serviceClientFactory.getUpsServiceClient();
            userTimeZone = await upsServiceClient.getSystemTimeZone(deviceId);
        } catch (error) {
        
            if (error.name !== 'ServiceError') {
                return handlerInput.responseBuilder.speak("There was a problem connecting to the service.").getResponse();
            }
            console.log('error', error.message);
        }
        const currentDateTime = new Date(new Date().toLocaleString("en-US", "America/Barbados")); // or {timeZone: userTimeZone}
        
        var currentDate = currentDateTime.getFullYear() + "-" + currentDateTime.getMonth() +  "-" + currentDateTime.getDate();
        var cH = currentDateTime.getHours(); // current Hour
        var cM = currentDateTime.getMinutes(); // current Minute
        var currentTime = cH.toString() + ":" + cM.toString();
        //var cS = currentDateTime.getSeconds(); // current Second
        
        var sessionAttributes = {
            "ID":id,
            "DateTime": currentDateTime,
        };
        
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);  //commit the sessions attributes
        
        var AWS = require("aws-sdk");
        
        var docClient = new AWS.DynamoDB.DocumentClient();
        var results = "";
        
        var params = {
            TableName : "4cdf2b3e-0ab7-4af5-bfcf-b20c60cf0f52",
            KeyConditionExpression: "#pkey = :value",
            ExpressionAttributeNames:{
                "#pkey": "id"
            },
            ExpressionAttributeValues: {
                ":value": id
            }
        };
        
        
        
        
        
        
        /*  End of gettiing date and time   */
        return  docClient.query(params, function(err,data) {
            if (err) {
                console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            } else {
                //console.log("Query succeeded.");
                //console.log("data = " +  JSON.stringify(data,null,2));
                data.Items.forEach(function(item) {
                    //console.log(" -", item.id + ": " + item.month);
                    results += item.Name;
                    /******************add date and id visitor entered office**********/
                });
            }
            
            if (results) {
               /* let ddb = new AWS.DynamoDB({apiVersion: '2012-10-08'});
                AWS.config.update({region: 'us-east-1'});
                var params = {
                TableName: 'DATE TABLE ENTER', //place the correct table name associaded with your alexa hosted skill here as was demonstrated in the video demonstration.
                Item: {
                'Date' : {S: currentDate},
                'Time' : {S: currentTime},
                'VisitorId' : {S: id},
         }
       };
       
               ddb.putItem(params, function(err, data){
                 if(err){
                     console.log("database put error");
                   console.log(err);
                 } else{
                   console.log('Successfully documented visitor');
                 }
               }); */
                speakOutput = `Thanks, you can enter the office ${results}`;
            }
            else {
                speakOutput = "What is your name?";
                
            }
           
            return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt()
            .getResponse();
            
        })
        .catch((error) => {
       console.error("Unable to query. Error:", JSON.stringify(error, null, 2));
            
        });
    }
};


const RecordNewVisitorIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RecordNewVisitorIntent';
    },
    async handle(handlerInput) {
        var session_attributes = await handlerInput.attributesManager.getSessionAttributes();
        
       // let current_date = SA.currentDate.replaceAll('-','');
        //let current_time = SA.currentHour.toString() + SA.currentMinutes.toString() + SA.currentSeconds.toString();*/
        
        const id = session_attributes.ID; 
        const name = handlerInput.requestEnvelope.request.intent.slots.name.value;
        const phone_number = handlerInput.requestEnvelope.request.intent.slots.phone_number.value;
        
        
        //dynamodb
        var AWS = require('aws-sdk');
       var ddb = new AWS.DynamoDB({apiVersion: '2012-10-08'});
       AWS.config.update({region: 'us-east-1'});
       
        var params = {
         TableName: '4cdf2b3e-0ab7-4af5-bfcf-b20c60cf0f52', //place the correct table name associaded with your alexa hosted skill here as was demonstrated in the video demonstration.
         Item: {
             'id' : {S: id},
             'Name' : {S: name},
             'Phone Number' : {S: phone_number.toString()},
         }
       };
       
       ddb.putItem(params, function(err, data){
         if(err){
             console.log("database put error");
           console.log(err);
         } else{
           console.log('Success');
         }
       }); 
        
        const speakOutput = `You can enter the office ${name}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

const RandomVisitorIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RandomVisitorIntent';
    },
    async handle(handlerInput) {
        /*const serviceClientFactory = handlerInput.serviceClientFactory;
        const deviceId = handlerInput.requestEnvelope.context.System.device.deviceId;
        let userTimeZone;
        try {
            const upsServiceClient = serviceClientFactory.getUpsServiceClient();
            userTimeZone = await upsServiceClient.getSystemTimeZone(deviceId);
        } 
        catch (error) {
        
            if (error.name !== 'ServiceError') {
                return handlerInput.responseBuilder.speak("There was a problem connecting to the service.").getResponse();
            }
            console.log('error', error.message);
        }*/
        const CDT = new Date(new Date().toLocaleString("en-US", "America/Barbados")); 
        
        let id =    CDT.getFullYear().toString().slice(2) + 
                    CDT.getMonth().toString() + 
                    CDT.getDate().toString() +
                    CDT.getHours().toString() +
                    CDT.getMinutes().toString() +
                    CDT.getSeconds().toString(); //21 12 30 15 33 48
                    
        var sessionAttributes = {
            "ID":id,
            "DateTime": CDT,
        };
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
                    
        
        
        const speakOutput = 'What is your name?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/*  END OF ADDED CODE   */

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .withApiClient(new Alexa.DefaultApiClient())
    .addRequestHandlers(
        LaunchRequestHandler,
        RandomVisitorIntentHandler, 
        RecordNewVisitorIntentHandler,
        RecordVisitorIntentHandler,
        HelloWorldIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();