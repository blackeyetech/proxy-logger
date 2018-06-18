const util = require("util");

process.on("message", (msg) => {
  switch (msg.type) {
  case "INFO":
  case "DEBUG":
    console.info(`${msg.type} (proxy): ${msg.name}: ${util.format(...msg.args)}`);
    break;
  case "ERROR":
  case "FATAL":
    console.error(`${msg.type} (proxy): ${msg.name}: ${util.format(...msg.args)}`);
    break;
  case "WARN":
    console.warn(`${msg.type} (proxy): ${msg.name}: ${util.format(...msg.args)}`);
  break;
  case "FLUSH":
    // Any clean up etc should be done here and when you are ready 
    // send the message "FLUSHED"
    setTimeout(() => { 
      process.send("FLUSHED");
    }, 1000);
    break;
  case "CLOSE":
    process.disconnect();
    break;
  default:
    break;
  }
});

process.on('SIGTERM', (code, signal) => {
  console.log("child process terminated");
});

process.on('SIGINT', (code, signal) => {
  console.log("child process interrupted");
});

process.on('exit', (code, signal) => {
  console.log("child process exited");
});
