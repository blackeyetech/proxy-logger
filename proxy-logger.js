const fork = require("child_process").fork;
const path = require("path");
const fs = require("fs");

// Config consts
const CFG_ROOT = "/logger";

const CFG_PROXY = "proxy";

class ProxyLogger extends besh.BeshLogger {
  constructor(name, logger) {
    super(name);

    let proxy = besh.config.get(CFG_ROOT, CFG_PROXY);

    if (proxy === undefined || proxy === "") {
      throw Error(`Configuration setting (${CFG_PROXY}) is required`);
    }

    // Check if the file has an absolute or relative path
    if (path.isAbsolute(proxy)) {
      if (!fs.existsSync(proxy)) {
        throw new Error(`Can not find file ${proxy}`);
      }
    } else {
      let fullName = path.resolve(process.cwd(), proxy);

      if (!fs.existsSync(fullName)) {
        throw new Error(
          `Can not find file ${proxy} in cwd ${process.cwd()}`);      
      }

      proxy = path.resolve(process.cwd(), proxy);
    }

    // We will not fork if we have been passed a logger
    if (logger === undefined) {
      this.logger = fork(proxy);
      this.forked = true;
    } else {
      this.logger = logger;
      this.forked = false;
    }
  }

  fatal(...args) {
    this.logger.send({ type: "FATAL", name: this.name, args });
  }

  error(...args) {
    this.logger.send({ type: "ERROR", name: this.name, args });
  }

  warn(...args) {
    this.logger.send({ type: "WARN", name: this.name, args });
  }

  info(...args) {
    if (this.level <= this.INFO_LEVEL) {  
      this.logger.send({ type: "INFO", name: this.name, args });
    }
  }

  debug(...args) {
    if (this.loggerLevel <= this.DEBUG_LEVEL) {
      this.logger.send({ type: "DEBUG", name: this.name, args });
    }
  }

  trace(...args) {
    if (this.loggerLevel <= this.TRACE_LEVEL) {
      this.logger.send({ type: "TRACE", name: this.name, args });
    }
  }

  childLogger(name) {
     return new ProxyLogger(name, this.logger);
	}

  async flush() {
    return new Promise((resolve, reject) => {
      this.logger.once("message", (msg) => {
        if (msg === "FLUSHED") {
          resolve();
        }
      });

      this.logger.send({ type: "FLUSH" });
    });
  }

  async close() {
    // Only a forked logger should close the logger 
    if (!this.forked) {
      return;
    }

    await this.flush();
    this.logger.send({ type: "CLOSE" });
  }
}

module.exports = ProxyLogger;
