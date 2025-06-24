import 'dotenv/config';
import Puppet from "#puppet/index.js";

const timeoutMs    = 15_000; 

async function main() {

  const puppet = await Puppet.getInstance();

  const page = puppet.getActivePage();

  await page.bringToFront();

  let data;

  const interviewPromise = waitForInterview(page);
  const FourOhThreePromise = waitFor403(page);
  const collectEmailPromise = waitCollectEmailTxt(page);

  await page.goto(process.env.TESTURL, {waitUntil: 'networkidle2'});

  // await page.reload();

  // If captch turnstile is not passed, it still goes to the job page. Seems that refresh can get to it.

  const applyBtnPromise = waitForApplyBtnTxt(page);

  // const appliedPPromise = waitForAppliedPTxt(page);  

  const winner = await Promise.race([
    FourOhThreePromise,
    interviewPromise, 
    applyBtnPromise,
    // appliedPPromise,
    collectEmailPromise
  ]);

  if (winner.kind === 'collectEmail') {    
    data = { message: "Captch detected." };
    await page.reload();
  } else if (winner.kind === 'interview') {
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
  const collectEmailSel = 'section.CollectEmailAddress div:nth-child(1)>h3'
  return page
  .waitForFunction((appliedBtnSel, collectEmailSel) => {
    const appliedBtn = document.querySelector(appliedBtnSel);
    const collectEmailH3 = document.querySelector(collectEmailSel);
    return appliedBtn && appliedBtn.innerText.trim() === 'You have applied' && (!collectEmailH3);
  }, 
  {visible: true, timeout: timeoutMs}, 
  appliedBtnSel,
  collectEmailSel
)
.then(() => {
  console.log("Applied paragraph found");  
  return { kind: 'appliedBtn', innerText: "You have applied" };
});
}

function waitCollectEmailTxt(page) {
  const url = 'https://www.ziprecruiter.com/api/apply/apply.engine.proto.v1beta1.API/IsLoggedInJobseeker';
  
  return page                             // resolves **as soon as we have the JSON**
  .waitForResponse(
    res => {
    return res.url() === url && res.status() === 403; // we are looking for a 403 status code
    },
    {timeout: timeoutMs},
  )
  // const collectEmailSel = 'section.CollectEmailAddress div:nth-child(1)>h3'
  // return page
  //   .waitForFunction((collectEmailSel) => {
  //     const el = document.querySelector(collectEmailSel);
  //     return el && el.innerText.trim() === 'What email should the hiring manager contact you at?';
  //   }, 
  //   {visible: true, timeout: timeoutMs}, 
  //   collectEmailSel
  // )
  .then(() => {
    // console.log("User not seen as logged in. Need to reload and pass captcha.");
    return { kind: 'collectEmail', innerText: "Collect email form found." };
  });
}

function waitFor403(page) {
  return page                             // resolves **as soon as we have the JSON**
  .waitForResponse(
    res => {
    return res.url() === process.env.TESTURL && res.status() === 403; // we are looking for a 403 status code
    },
    {timeout: timeoutMs},
  )
  .then(async res => {
    return { kind: 'captcha', innerText: "Found 403" }; // flag so we know which promise won
  });
}

main();