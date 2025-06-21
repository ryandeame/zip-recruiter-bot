import Puppet from "#puppet/index.js";

export default async function oneClickPages() {

    const puppet = await Puppet.getInstance();

    const page = puppet.getActivePage();

    // const oneClickBtnSel = 'span#job_apply_button_portal_target button';

    // const oneClickBtn = await page.waitForSelector(oneClickBtnSel);
  
    // await oneClickBtn.click();

    return;

}



// page.on('response', async (response) => {
//   const url = response.url();
//   if (url.includes('/your-question-endpoint')) { // Replace with actual endpoint substring
//     try {
//       const data = await response.json();
//       // Now you can access data.questionAnswerGroup.questions, etc.
//       console.log('Questions:', data.questionAnswerGroup.questions);
//     } catch (e) {
//       console.error('Failed to parse response:', e);
//     }
//   }
// });



// const questionTypes = [
//     {
//         "name": "questions",
        
//     }
// ]

// ZipRecruiter seems to do a per page response with all question data

// Example: 
// {
//     "group": 1,
//     "totalGroups": 6,
//     "totalQuestions": 6,
//     "status": "SCREENING_QUESTIONS",
//     "questionAnswerGroup": {
//         "questions": [
//             {
//                 "order": 1,
//                 "id": "864245953",
//                 "question": {
//                     "options": [
//                         {
//                             "label": "Yes",
//                             "value": "1",
//                             "ordinal": 1
//                         },
//                         {
//                             "ordinal": 2,
//                             "label": "No",
//                             "value": "2"
//                         }
//                     ],
//                     "order": 1,
//                     "id": "864245953",
//                     "text": "Are you authorized to work in the U.S.?",
//                     "type": "radioButton"
//                 }
//             }
//         ],
//         "group": 1
//     }
// }

// --- Logic Explanation: Automated Question Answering with Puppet ---
//
// 1. Retrieve the Response:
//    - The application receives a JSON response from ZipRecruiter containing the current group of screening questions.
//    - Each question includes its text, type, and a list of possible options.
//
// 2. Analyze the Information:
//    - The code parses the response to extract the questions and their available options.
//    - Logic is applied to determine which answer to select (e.g., always select "Yes", or use custom logic based on question text).
//
// 3. Use the Puppet Class to Interact with the Page:
//    - The Puppet singleton is used to get the active browser page.
//    - For each question, the script locates the corresponding input (e.g., radio button) on the page using Puppeteer's page methods.
//    - The script selects the desired answer by clicking the appropriate option.
//    - After all questions are answered, the script locates and clicks the "Continue" button to advance to the next group.
//
// Example (pseudo-code):
// const puppet = await Puppet.getInstance();
// const page = puppet.getActivePage();
// for (const question of questions) {
//     // Find the selector for the desired option (e.g., label text or value)
//     await page.click('input[value="1"]'); // Select "Yes"
// }
// await page.click('button[type="submit"]'); // Click Continue
//
// This process repeats for each group of questions until all are completed.