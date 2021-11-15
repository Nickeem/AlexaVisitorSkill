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
        /*const serviceClientFactory = handlerInput.serviceClientFactory;
        const deviceId = handlerInput.requestEnvelope.context.System.device.deviceId;*/
        
        const id = handlerInput.requestEnvelope.request.intent.slots.ID.value;
        var speakOutput; 
        
        const currentDateTime = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Barbados"})); // or {timeZone: userTimeZone}
        
        var currentDate = currentDateTime.getFullYear() + "-" + (currentDateTime.getMonth()+1) +  "-" + (currentDateTime.getDate()).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
        var cH = currentDateTime.getHours(); // current Hour
        var cM = (currentDateTime.getMinutes()).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}); // current Minute
        var currentTime = cH + ":" + cM
        //var cS = currentDateTime.getSeconds(); // current Second
        
        var sessionAttributes = {
            "ID":id,
            "Admin_User": "no"
        };
        
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);  //commit the sessions attributes
        console.log(handlerInput.requestEnvelope.request.intent.slots);
        var AWS = require("aws-sdk");
        
        var docClient = new AWS.DynamoDB.DocumentClient();
        var results = {};
        
        var params = {
            TableName : "Visitor_Info",
            KeyConditionExpression: "#pkey = :value",
            ExpressionAttributeNames:{
                "#pkey": "Visitor ID"
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
              //results = data.Items;
                //console.log("Query succeeded.");
                //console.log("data = " +  JSON.stringify(data,null,2));
                data.Items.forEach(function(item) {
                    //console.log(" -", item.id + ": " + item.month);
                    results = item;
                });
            }
            //console.log(results);
            if (Object.keys(results).length > 0) {
                let ddb = new AWS.DynamoDB({apiVersion: '2012-10-08'});
                AWS.config.update({region: 'us-east-1'});
                
                var params2 = {
                TableName: 'Visitor_TimeStamps', //place the correct table name associaded with your alexa hosted skill here as was demonstrated in the video demonstration.
                    Item: {
                    'Date' : {S: currentDate},
                    'Time' : {S: currentTime},
                    'Visitor_ID' : {S: id},
                   }
                 };
       
               ddb.putItem(params2, function(err, data){
                 if(err){
                     console.log("database put error");
                   console.log(err);
                 } else{
                   console.log('Successfully documented visitor');
                 }
               }); 
               if (results.Permission) {
                 var sa = handlerInput.attributesManager.getSessionAttributes();
                 sa.Admin_User = "yes";
                 speakOutput = "Hello admin, you can query visitor information by specifying a date and time range";
                 
               } else
               {
                  speakOutput = `Thanks, you can enter the office ${results.Name}`; 
                  return handlerInput.responseBuilder
                    .speak(speakOutput)
               }
            }
            else {
                speakOutput = "What is your full name?";
                
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
        var session_attributes = handlerInput.attributesManager.getSessionAttributes();
        
        const id = session_attributes.ID;
        const name = handlerInput.requestEnvelope.request.intent.slots.name.value;
        const last_name = handlerInput.requestEnvelope.request.intent.slots.lastname.value;
        const fullname = name.charAt(0).toUpperCase() + name.slice(1) + " "+ last_name.charAt(0).toUpperCase() + last_name.slice(1);
        const phone_number = handlerInput.requestEnvelope.request.intent.slots.phone_number.value;
        const visitor_address = handlerInput.requestEnvelope.request.intent.slots.Address.value;
        
        
        //dynamodb
        var AWS = require('aws-sdk');
       var ddb = new AWS.DynamoDB({apiVersion: '2012-10-08'});
       AWS.config.update({region: 'us-east-1'});
       
        var params = {
         TableName: 'Visitor_Info', //place the correct table name associaded with your alexa hosted skill here as was demonstrated in the video demonstration.
         Item: {
             'Visitor ID' : {S: id},
             'Name' : {S: fullname},
             'Address' : {S: visitor_address}, // new line
             'Phone Number' : {S: phone_number.toString()},
         }
       };
       
       ddb.putItem(params, function(err, data){
         if(err){
             console.log("database put error");
           console.log(err);
         } else{
           console.log('Success in adding new visitor');
         }
       }); 
       
       // time entered the office
        const currentDateTime = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Barbados"}));
        var currentDate = currentDateTime.getFullYear() + "-" + (currentDateTime.getMonth()+1) +  "-" + (currentDateTime.getDate()).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
        var cH = currentDateTime.getHours(); // current Hour
        var cM = (currentDateTime.getMinutes()).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}); // current Minute
        var currentTime = cH + ":" + cM;
        
        var params = {
                TableName: 'Visitor_TimeStamps', //place the correct table name associaded with your alexa hosted skill here as was demonstrated in the video demonstration.
                    Item: {
                    'Date' : {S: currentDate},
                    'Time' : {S: currentTime},
                    'Visitor_ID' : {S: id},
                   }
                 };
       
         ddb.putItem(params, function(err, data){
           if(err){
               console.log("database put error");
             console.log(err);
           } else{
             console.log('Successfully documented new visitor');
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
        
        const CDT = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Barbados"}));
        
        let id =    CDT.getFullYear().toString().slice(2) + 
                    (CDT.getMonth()+1).toString() + 
                    CDT.getDate().toString() +
                    CDT.getHours().toString() +
                    CDT.getMinutes().toString() +
                    CDT.getSeconds().toString(); //21 12 30 15 33 48
                    
        var sessionAttributes = {
            "ID":id,
        };
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        
        const speakOutput = 'What is your full name?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const VisitorQueryIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'VisitorQueryIntent';
    },
    async handle(handlerInput) {
        var speakOutput;
        
        var session_attributes = handlerInput.attributesManager.getSessionAttributes();
        if (session_attributes.Admin_User == "no") {
          speakOutput = "You do not have the authorization to perform this action";
          return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt()
            .getResponse();
        }
        
        const currentDateTime = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Barbados"}));
        var currentDate = currentDateTime.getFullYear() + "-" + (currentDateTime.getMonth()+1) +  "-" + (currentDateTime.getDate()).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
        
        // sot values and defaults
        const slot_values = handlerInput.requestEnvelope.request.intent.slots;
        console.log(slot_values);
        var date = (slot_values.date.value) ? slot_values.date.value : currentDate;
        var start_time = (slot_values.start_time.value) ? slot_values.start_time.value : "0:01";

        var end_time = (slot_values.end_time.value) ? slot_values.end_time.value : "23:59";
        console.log ("date = "+date);
        
        const nodemailer = require("nodemailer");
        var transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          //host: 'mail.gmx.com',
          port: 465,
          secure: true, 
          //service: 'gmail',
          auth: {
            user: 'enteryours@gmail.com',
            pass: 'password'
            //user: 'codepimps@gmx.com',
            //pass: ''
          }
      });
      
        var params = {
            TableName : "Visitor_TimeStamps",
            KeyConditionExpression: "#pkey = :value AND #sskey BETWEEN :sortkeyval1 AND :sortkeyval2",
            ExpressionAttributeNames:{
                "#pkey": "Date",
                "#sskey": "Time"
            },
            ExpressionAttributeValues: {
                ":value": date,
                ":sortkeyval1": start_time,
                ":sortkeyval2": end_time
            }
        };
        
        var AWS = require("aws-sdk");
        var docClient = new AWS.DynamoDB.DocumentClient();
        var results = {};
        var other_results = "";
        var batch_results_normal_format = "";
        var batch_results_csv_format = "Visitor ID, Address, Name, Phone Number\n";
        
        return  docClient.query(params, function(err,data) {
            if (err) {
                console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            } else {
                console.log(data);
              results = data.Items;
            }
            var visitor_keys = {}
            var visitors = [];
            var results_csv_format = "Date, Time, VisitorID\n";
            if (results.length > 0) {
                for (let elem of results) {
                    visitor_keys[elem.Visitor_ID] = "";// variable to put visitor information in
                    results_csv_format += Object.values(elem).join(", ");
                    results_csv_format += "\n";
                }
                let results_normal_format = results_csv_format.replace(/, /g, "\t\t");
                for (let key of Object.keys(visitor_keys)) {
                    visitors.push({'Visitor ID': `${key}`});   
                }
               console.log("key array: "+Object.keys(visitor_keys));
                var batch_params = {
                    RequestItems: {
                        'Visitor_Info': {
                            Keys: visitors,
                            //[{'Visitor ID': '123456'}],
                            ProjectionExpression: '#visitor_id, Address, #visitor_name, #visitor_pnumber',
                            ExpressionAttributeNames:{
                                "#visitor_id": "Visitor ID",
                                "#visitor_name": "Name",
                                "#visitor_pnumber": "Phone Number"
                            }
                        }
                    }
                };
                        
                
                docClient.batchGet(batch_params, function(err, data) {
                  if (err) {
                    console.log("Error", err);
                  } else {
                        let batch_results = data.Responses.Visitor_Info;
                        console.log("batch data: "+JSON.stringify(data.Responses.Visitor_Info));
                        if (batch_results.length > 0) {
                            for (let elem of batch_results) {
                                console.log(elem);
                                batch_results_csv_format +=  Object.values(elem).join(", ");
                                batch_results_csv_format += "\n";
                            }
                            //console.log("formatted data:" + batch_results_csv_format);
                            batch_results_normal_format += batch_results_csv_format.replace(/, /g, "\t\t\t\t\t");
                            //console.log("formatted data:" + batch_results_normal_format);
                            //results_normal_format += results_csv_format;
                            //console.log(batch_results_normal_format);
                            
                            var mailOptions = {
                  from: 'youremail@gmail.com',
                  to: 'realnigelunos@gmail.com',
                  subject: `Visitors who entered the office ${date} between ${start_time} and ${end_time}`,
                  text: (results_normal_format + "\n\n" + batch_results_normal_format)
              };
                
              transporter.sendMail(mailOptions, function(error, info){
                  if (error) {
                    console.log(error);
                  } else {
                    console.log('Email sent: ' + info.response);
                  }
              }); 
                    }
                  }
                });
                //console.log("csv results: "+batch_results_csv_format)
                //console.log("normal results: "+batch_results_normal_format);
                console.log(results_normal_format );
            // testing email feature
              
                speakOutput = `The information was sent to you`;
            } // end of results.length
            else {
                speakOutput = "No information was found";
                
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
        VisitorQueryIntentHandler,
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