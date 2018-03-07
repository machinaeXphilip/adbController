
/*
$ adb --version
Android Debug Bridge version 1.0.39
Version 0.0.1-4500957
Installed as /usr/local/bin/adb
*/

const shell = require('shelljs');
const player = require('play-sound')(opts = {}); // get better sound lib with events when sound done


let response;

// Run external tool synchronously
response =shell.exec('adb devices',{silent:true})

if ( response.code !== 0) {
  shell.echo('Error: adb command failed');
  shell.exit(1);
}
else {
  console.log(response.stdout.trim("/n"));

  // now start listener for incoming calls

    //setInterval(checkCALLIN, 1500);

    setInterval(checkCALLOUT, 500);
    // make a testcall:
    makeCALLOUT("+4915735981516");

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

function checkCALLOUT()
{
  let CallState = shell.exec('adb logcat -d -e PhoneStatusListener -T 2000',{silent:true})

  //CallState = CallState.stdout.replace("mCallState=","").replace("\n","").substr(2);
  console.log(CallState.stdout);

  if (CallState != "")
  {
    if (CallState.indexOf("PhoneState = OFFHOOK") !== -1 && CallState.indexOf("DIALING") !== -1)
    {
      console.log("Dialing");
    }
    else if (CallState.indexOf("PhoneState = OFFHOOK") !== -1 && CallState.indexOf("ALERTING") !== -1)
    {
      console.log("Ringing");
    }
    else if (CallState.indexOf("PhoneState = IDLE") !== -1 && CallState.indexOf("CallState = IDLE") !== -1 && CallState.indexOf("CallState = ACTIVE") === -1)
    {
      console.log("busy"); // busy only true if not Active before
    }

    if (CallState.indexOf("PhoneState = OFFHOOK") !== -1 && CallState.indexOf("ACTIVE") !== -1)
    {
      if (CallState.indexOf("PhoneState = IDLE") !== -1 && CallState.indexOf("IDLE") !== -1)
      console.log("call ended successfully after answer.");
    }

    //console.log(CallState);

    // HERE REACT TO CALLSTATES:

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

  shell.exec('adb shell am start -a android.intent.action.CALL -d tel:'+number,{silent:true});
  // problem: how to see if answered or hung?


}

function playsound()
{
  player.play('test.mp3', function(err){
    if (err) throw err
  })
}
