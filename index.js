import 'dotenv/config';
import Puppet from "#puppet/index.js";
import oneClickPages from './oneClickPages.js';

async function main() {

  const puppet = await Puppet.getInstance();

  const page = puppet.getActivePage();

  await page.bringToFront();

  const urlPattern = 'https://www.ziprecruiter.com/apply/api/v2/interview?'; // Use your actual pattern

  //Listen for requests matching the pattern
  page.on('request', async (request) => {
      // console.log(`request found from ${request.url()}`);
  if (
      request.resourceType() === 'fetch' &&
      request.url().startsWith(urlPattern)
  ) {
      // Wait for the response to this request
      const response = await page.waitForResponse(
      res => res.url() === request.url() && res.request().method() === request.method()
      );
      const data = await response.json();
      console.log('Received question data:', data);
  }
  });

  await page.goto(process.env.TESTURL, {waitUntil: 'networkidle2'});

  try{

    await oneClickPages();

  } catch (error) {
    console.error("Error clicking the button:", error.message);
  }


  // await puppet.disconnect();

}

main();