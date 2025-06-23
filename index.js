import 'dotenv/config';
import Puppet from "#puppet/index.js";

const timeoutMs    = 15_000; 

async function main() {

  const puppet = await Puppet.getInstance();

  const page = puppet.getActivePage();

  await page.bringToFront();

  let data;

  const interviewPromise = waitForInterview(page);

  await page.goto(process.env.TESTURL, {waitUntil: 'domcontentloaded'});

  const applyBtnPromise = waitForApplyBtnTxt(page);

  const appliedPPromise = waitForAppliedPTxt(page);

  const winner = await Promise.race([
    interviewPromise, 
    applyBtnPromise,
    appliedPPromise
  ]);

  if (winner.kind === 'interview') {
    data = winner.data;
  } else if (winner.kind === 'applyBtn') {
    
    const oneClickBtnSel = 'span#job_apply_button_portal_target button';

    const oneClickBtn = await page.waitForSelector(oneClickBtnSel);

    [interview, click] = await Promise.all([
      waitForInterview(page),
      oneClickBtn.click()
    ]);

    data = interview.data;

    // Some one clicks are truly one click and do not require answering questions.

    await oneClickBtn.click();
  } else if (winner.kind === 'appliedBtn') {
    data = { message: "You have already applied to this job." };
  }

  console.log("Data received:", data);

  // try{

  //   await oneClickPages();

  // } catch (error) {
  //   console.error("Error clicking the button:", error.message);
  // }


  // await puppet.disconnect();

}

// 2. helper to wait for the interview API call ----------------------------
function waitForInterview(page) {
  const urlPattern   = 'https://www.ziprecruiter.com/apply/api/v2/interview?';
  return page                             // resolves **as soon as we have the JSON**
    .waitForResponse(
      res => {
      return res.url().startsWith(urlPattern)},
      {timeout: timeoutMs},
    )
    .then(async res => {
      const data = await res.json();
      return { kind: 'interview', data }; // flag so we know which promise won
    });
}

// 3. helper to wait for the Apply button ----------------------------------
function waitForApplyBtnTxt(page) {
  const applyBtnSel  = 'div.ApplyButton>button';
  return page
    .waitForFunction((applyBtnSel) => {
      console.log(applyBtnSel);
      const el = document.querySelector(applyBtnSel);
      return el && el.innerText.trim() === '1-Click Apply';
    }, 
    {visible: true, timeout: timeoutMs}, 
    applyBtnSel
  )
  .then(() => {
    console.log("Apply button found");  
    return { kind: 'applyBtn', innerText: "found" };
  });
}

// 3. helper to wait for the Apply button ----------------------------------
function waitForAppliedPTxt(page) {
  const appliedBtnSel  = 'p.applied_status[role="status"]';
  return page
    .waitForFunction((appliedBtnSel) => {
      const el = document.querySelector(appliedBtnSel);
      return el && el.innerText.trim() === 'You have applied';
    }, 
    {visible: true, timeout: timeoutMs}, 
    appliedBtnSel
  )
  .then(() => {
    console.log("Applied paragraph found");  
    return { kind: 'appliedBtn', innerText: "You have applied" };
  });
}

main();