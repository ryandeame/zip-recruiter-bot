import 'dotenv/config';
import Puppet from "#puppet/index.js";
import { JSDOM } from 'jsdom';

async function main() {

    const searchTerms = ["Software Engineer", "Data Scientist", "Product Manager"];

    const pageLimit = 10; // Number of pages to scrape per search term

    const puppet = await Puppet.getInstance();
    
    const page = puppet.getActivePage();

    const jobPosts = new JobPosts();

    for (const searchTerm of searchTerms) {

        for (let i = 1; i <= pageLimit; i++) {

            const jobs = await jobPosts.getJobs(page, searchTerm, i);         

            const jobsResponse = await fetch(process.env.LOCALSERVERURL, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobPosts: jobs,
                })
            });

            const message = await jobsResponse.json();

            console.log(message);
        }
        
    }  

    await puppet.disconnect();

}

class JobPosts {
    constructor() {}

    async getJobs(page, searchTerm, pageNumber) {
        const jobResultsSelector = "div.job_result_two_pane";
        const url = `https://www.ziprecruiter.com/jobs-search?search=${searchTerm}&location=usa&page=${pageNumber}`;
        const [response] = await Promise.all([
        page.waitForResponse(response => {
                return response.url().startsWith('https://www.ziprecruiter.com/jobs-search?') && response.status() === 200;
            }),
            page.goto(url)
        ])

        // 2. get the HTML
        const html = await response.text();
        // 3. parse it with jsdom
        const dom = new JSDOM(html);
        const document = dom.window.document;

        // 4. grab the script tag
        const script = document.getElementById('js_variables');
        if (!script) {
        throw new Error('Couldn’t find #js_variables in the response HTML');
        }

        // 5. extract its text and pull out the object
        const scriptContent = script.textContent.trim();

        const jsVars = eval(`(${scriptContent})`);

        const jobList = jsVars.jobList;

        const jobPosts = jobList.map(job => {
            const quickApply = job.QuickApplyHref.length ? true : false;
            return {
                url: job.Href,
                title: job.Title,
                company: job.OrgName,
                location: `${job.City}, ${job.State}`,
                salary: job.FormattedSalaryShort,
                type: job.EmploymentType,
                quickApply: quickApply,
            };
        });

        return jobPosts;

    }
}

main();