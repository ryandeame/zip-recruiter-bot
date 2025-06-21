import "dotenv/config";
import Puppet from "./index.js";

// This test assumes you have jest installed. If not, install it with npm install --save-dev jest
// Also, puppeteer-real-browser must be installed and Chrome path set in env variables for this to work.

describe("Puppet class", () => {
  let puppet;

  beforeAll(async () => {
    puppet = await Puppet.getInstance();
  });

  afterAll(async () => {
    await puppet.disconnect();
  });

  test("should produce a browser object", async () => {
    expect(puppet.getBrowser()).toBeDefined();
    expect(typeof puppet.getBrowser()).toBe("object");
  });

  test("should produce a page object", async () => {
    expect(puppet.getActivePage()).toBeDefined();
    expect(typeof puppet.getActivePage()).toBe("object");
    expect(puppet.getActivePage().goto).toBeInstanceOf(Function);
  });
});
