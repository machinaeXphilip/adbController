
/*
adbController
ccncsa 4.0 (by) Philip Steimel www.machinaesc.de

node script using adb (android-debug-bridge) as a bridge for incoming android
outgoing calls between a computer and an android phone.

basic hack to make robocalls from a computer. don't be evil! use it for fun stuff
like scavanger hunts!

$ adb --version
Android Debug Bridge version 1.0.39
Version 0.0.1-4500957
Installed as /usr/local/bin/adb

TO DOs:
- add cancelTimer for clearInterval in case of no answered or errors
- solve problem of soundrouting (hardware? cable soildering?)
- decide on how to deal with the IncomingCall listener (always open or only if
not calling in)

*/

const shell = require('shelljs');
const player = require('play-sound')(opts = {}); // get better sound lib with events when sound done
const http = require('http');
const express = require('express');

let response;
let runningInterval;

let app = express();

startSMSServer();

  // Run external tool synchronously
  response =shell.exec('adb devices',{silent:true})

  if ( response.code !== 0)
  {
    shell.echo('Error: adb command failed');
    shell.exit(1);
  }
  else
  {
    console.log(response.stdout.trim("/n"));

      // now start listener for incoming calls
      setInterval(checkCALLIN, 1500);

      // make a testcall:
      //makeCALLOUT("+4915735981516");

  }





function checkCALLIN()
{
  let CallIncomingNumber = shell.exec('adb shell dumpsys telephony.registry | grep CallIncomingNumber=',{silent:true})

  CallIncomingNumber = CallIncomingNumber.stdout.replace("mCallIncomingNumber=","").replace("\n","").substr(2);


  if (CallIncomingNumber != "")
  {
    // INCOMING CALL FROM NUMBER CallIncomingNumber !!!! YES!
      // next: dispatch event to deal with it and realize when it stops
    console.log(CallIncomingNumber);
    answer();
  }
}

let state = "";
let state_old = "busy" // to hinder busy trigger at startup

function checkCALLOUT()
{

  let CallState = shell.exec('adb logcat -d -e PhoneStatusListener -T 5000',{silent:true})

  //CallState = CallState.stdout;

  CallState = CallState.stdout.replace(/-/g,"").replace("beginning of main","").replace("beginning of system","").trim("\n").split("\n");

  let len = CallState.length;
  //console.log(len);
  let latestCallState = CallState[len-1];


  if (latestCallState != "")
  {
    //console.log(latestCallState);


    if (latestCallState.indexOf("PhoneState = OFFHOOK") !== -1 && latestCallState.indexOf("CallState = DIALING") !== -1)
    {
      state = "dialing";
      //console.log("Dialing");
    }
    else if (latestCallState.indexOf("PhoneState = OFFHOOK") !== -1 && latestCallState.indexOf("CallState = ALERTING") !== -1)
    {
      state = "ringing";
      //console.log("Ringing");
    }
    else if (latestCallState.indexOf("PhoneState = IDLE") !== -1 && latestCallState.indexOf("CallState = IDLE") !== -1)
    {
      if (state == "online")
      {
        state = "success";
      }
      else if (state != "success")
      {
        state = "busy";
      }
      //console.log("busy"); // busy only true if not Active before
    }

    else if (latestCallState.indexOf("PhoneState = OFFHOOK") !== -1 && latestCallState.indexOf("CallState = ACTIVE") !== -1)
    {
        state = "online"
    }

    //console.log(state);
    //console.log(CallState);

    // HERE REACT TO CALLSTATES:
    if (state == "busy" || state == "success")
    {
      console.log("Callout ended");
      clearInterval(runningInterval);
    }

  }


  if (state != state_old)
  {
    console.log(state);
    state_old = state;
  }


}


function answer()
{
  shell.exec('adb shell input keyevent 5',{silent:true});
  setTimeout(playsound,500);
  setTimeout(hang,3000);
}


function hang()
{
  shell.exec('adb shell input keyevent 6',{silent:true});
}


function makeCALLOUT(number)
{

  runningInterval = setInterval(checkCALLOUT, 500); // check if answered, ringing, busy or success

  shell.exec('adb shell am start -a android.intent.action.CALL -d tel:'+number,{silent:true});


}

function playsound()
{
  player.play('test.mp3', function(err){
    if (err) throw err
  })
}

function startSMSServer()
{
    app.get('/', function (req, res) {

      res.sendStatus(200);
      console.log(req.query);
      //res.send('{"test":"hallo","welt":"da"}');
    })

    var server = app.listen(8080, function () {
       var host = server.address().address
       var port = server.address().port

       console.log("sms server listening at http://%s:%s", host, port)
    })

}

function sendSMS(ip,number, body)
{
    number = encodeURIComponent(number);
    body = encodeURIComponent(body);

    http.get('http://'+ip+'/send.html?smsto='+number+'&smsbody='+body+'&smstype=sms', (resp) => {
    resp.on('end', () => {
      console.log("sms send");
    });

  }).on("error", (err) => {
    console.log("sending sms Error: " + err.message);
  });


}


// export the module (to be done: get global vars in via this.)
module.exports = {
    makeCALLOUT: makeCALLOUT,
    checkCALLOUT: checkCALLOUT,
    checkCALLIN: checkCALLIN,
    answer: answer,
    hang: hang,
    sendSMS: sendSMS
};
