

import { api } from "./ai-driver"
const trace = require("track-n-trace")
require('source-map-support/register')
const fs = require('fs-extra')


async function main() {
        const config = {
                apiService: "gemini",     // gemini,  openai or claude
                json: true,               // question includes request for json
                html: true,               // question includes request for html
                model: "gemini-2.0-flash",
                //model: "claude-3-5-sonnet-20241022",
                question: `Comprehensive list of name and city of suppliers of mud pumps. 
                Include web page link if possible. 
                Results as JSON and web page. 
                Do not load the JSON from a file to create web page.
                provide JSON data and HTML separately.
                If city not known, then city should be empty string.
                Include in the web page the instructions and comments/reservations..
                Include the number of suppliers found in the web page.`,
                temperature: "0",           // openapi & claude only

                /* not implemented yet */
                //top_p:"0.5",
                //max_tokens:"100",
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


                if (config.json && result.json) {
                        console.log('writing json')
                        await fs.writeFile('result.json', result.json, { spaces: 2 })
                }
                if (config.html && result.html) {
                        console.log('writing html')
                        await fs.writeFile('result.html', result.html, { spaces: 2 })
                }
                if (config.json || config.json) {
                        console.log('writing Connents (excluding any json or html)')
                        await fs.writeFile('result1.txt', result.comments, { spaces: 2 })
                }
        } catch (e) {
                console.log(e)
        }
}
main()