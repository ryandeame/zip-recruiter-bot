import { connect } from "puppeteer-real-browser";

class Puppet {
  constructor() {
    if (Puppet.instance) {
      throw new Error("Use Puppet.getInstance() instead of new.");
    }

    // instance state
    this.browser = null;
    this.page    = null;
    this.pidPage = null;
  }

  /** 
   * Lazily creates (on first call) and then returns the singleton. 
   */
  static async getInstance() {
    if (!Puppet.instance) {
      const inst = new Puppet();
      await inst._init();
      Puppet.instance = inst;
    }
    return Puppet.instance;
  }

  /** your old set-up logic, assigning to this.browser / this.page / this.pidPage */
  async _init() {
    const { browser } = await connect({
      headless: false,
      args: [],
      customConfig: {
        chromePath: process.env.CHROMEPATH,
        userDataDir: process.env.USRDIR
      },
      fingerprint: true,
      turnstile: true,
      connectOption: {
        // browserWSEndpoint: json.webSocketDebuggerUrl,
        defaultViewport: {
          width: 1920,
          height: 1080,
          deviceScaleFactor: 1,
          isMobile: false,
        },
      },
      ignoreAllFlags: true,
    });

    this.browser = browser;

    await this.setFreshPages();

    return;
  }

  /** disconnects & resets the singleton so you can re-init later if needed */
  async disconnect() {
    if (this.browser) {
      await this.browser.disconnect();
      this.browser = this.page = this.pidPage = null;
      Puppet.instance = null;
    }
  }

  async setFreshPages(){
    // 3) close any extra blank tabs, open a fresh one
    const startPage = await this.browser.newPage();

    // await startPage.goto("https://bot-detector.rebrowser.net/");
    const startClient = await startPage.createCDPSession();

    // send the Target.getTargetInfo command
    const startTargetInfo = await startClient.send('Target.getTargetInfo');
    const startTargetId = startTargetInfo.targetInfo.targetId;

    let pages = await this.browser.pages();
    if(!!pages.length){
      for(const page of pages){
        const client = await page.createCDPSession();
        const { targetInfo } = await client.send('Target.getTargetInfo');

        if(targetInfo.targetId !== startTargetId){
          await page.close();
        }

      }
    }    

    const pidPage = await this.browser.newPage();

    // 4) display PID info in the second tab
    const nodePid = process.pid;
    const psPid   = process.ppid;
    // const title   = `NodePid ${nodePid}, Port: ${port}`;
    const title   = `NodePid ${nodePid}`;
    await pidPage.evaluate(t => { document.title = t }, title);

    const htmlContent = `
      <h1>Node PID: ${nodePid}</h1>
      <h1>Parent PID: ${psPid}</h1>
    `;
    await pidPage.evaluate(content => {
      const policy = trustedTypes.createPolicy("escape", {
        createHTML: s => s
      });
      document.body.innerHTML = policy.createHTML(content);
    }, htmlContent);

    // 5) bring main page to front and handle beforeunload dialogs
    startPage.on("dialog", d =>
      d.type() === "beforeunload" && d.accept()
    );

    this.page    = startPage;
    this.pidPage = pidPage;
  }

  getActivePage() {
    return this.page;
  }

  getBrowser() {
    return this.browser;
  }
}

// initialize the static holder
Puppet.instance = null;

export default Puppet;
