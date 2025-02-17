

import { api } from "./std-ai-api"
const trace = require("track-n-trace")
require('source-map-support/register')
const fs = require('fs-extra')


async function main() {
        const config = {
      //          silent: true,
      //          apiService: "claude",     // gemini,  openai or claude
      //          model: "claude-3-5-sonnet-20241022",

      //          apiService: "gemini",
      //          model: "gemini-2.0-flash",

                apiService: "openai",
                model: "gpt-4o-2024-08-06",

                
                question: `Comprehensive list of name and city of suppliers of mud pumps. 
                Include web page link if possible. 
                Results as JSON and web page. 
                Do not load the JSON from a file to create web page.
                provide JSON data and HTML separately.
                If city not known, then city should be empty string.
                Include in the web page the instructions and comments/reservations..
                Include the number of suppliers found in the web page.`,
                temperature: "0",           // openapi & claude only
                max_tokens:"8000",
 
                /* not implemented yet */
                //top_p:"0.5",
                //n:"1",
                //stop:"",
                //freqency_penalty:"0",
                //presence_penalty:"0",
        }

        let result: any = await api(config)
        trace.log('***************************************************************')
        trace.log(result)
        try {
                console.log('writing Content')
                await fs.writeFile('result.txt', result.content, { spaces: 2 })


                if (result.json) {
                        console.log('writing json')
                        await fs.writeFile('result.json', result.json, { spaces: 2 })
                }
                if (result.html) {
                        console.log('writing html')
                        await fs.writeFile('result.html', result.html, { spaces: 2 })
                }
                if (result.comments) {
                        console.log('writing Comments (excluding any json or html)')
                        await fs.writeFile('result1.txt', result.comments, { spaces: 2 })
                }
        } catch (e) {
                console.log(e)
        }
}
main()