import * as dotenv from 'dotenv';
dotenv.config();
import { setTimeout } from 'timers/promises';
import { OpenAI } from "openai";
const { GoogleGenerativeAI } = require("@google/generative-ai");
import Anthropic from "@anthropic-ai/sdk";
import { error } from 'console';
//import { Message, MessageParam } from '@anthropic-ai/sdk';

// Update the claudeParms type definition

const trace = require("track-n-trace")
require('source-map-support/register')
// const { config } =Í require("./aiapi-config.js");

/**
 * 
 *  Retry in the event of failure
 * 
 * Claude provided these routines. Presumable boilerpated.l
 * 
 * @param fn 
 * @param retries 
 * @param delay 
 * @returns 
 */
async function withRetry<T>(
        fn: () => Promise<T>,
        retries: number = 3,
        delay: number = 1000
): Promise<T> {
        try {
                return await fn();
        } catch (error: any) {
                if (retries === 0 || !isRetryableError(error)) throw error;
                await setTimeout(delay);
                return withRetry(fn, retries - 1, delay * 2);
        }
}
/**
 * 
 * Is the error re-tryable
 * 
 * @param error 
 * @returns 
 */
function isRetryableError(error: any): boolean {
        return error?.message?.includes('ENOTFOUND') ||
                error?.message?.includes('Connection error') ||
                error?.message?.includes('timeout');
}

/**
 * 
 * api makes api calls to an ai service
 * 
 * @param {object} config 
 * @returns {object} resultObject}
 * 
 * See readme.md for details
 */
async function api(config: any) {

        trace.log(config);

        let silent: boolean = false;
        if (config.silent) { silent = true }

        /** Name of servvice */
        let apiService: string = "gemini";                              // Default to gemini
        if (config.apiService) { apiService = config.apiService; }

        if (apiService != "gemini" && apiService != "openai" && apiService != "claude") {throw new Error('Invalid apiService')}

        /* Model to use */
        let modelName: string = "";   // Default to false 
        const defaults = {
                gemini: "gemini-2.0-flash",
                openai: "gpt-4o-mini",
                claude: "claude-3-5-sonnet-20241022"
        }
        let key: keyof typeof defaults
        for (key in defaults) {
                if (apiService == key) { modelName = defaults[key] }
        }
        if (config.model) { modelName = config.model }
 
        if (!silent) {console.log(`Using ${apiService} with model ${modelName}`)}

        /** Prompt to use */
        let prompt: string = "Tell me a joke";              // default
        if (config.question) { prompt = config.question }


        /** Temperature */
        let temperature: number = 0;
        if (config.temperature) { temperature = parseInt(config.temperature) }

        /** Max Tokens */
        let max_tokens: number = 100 ;
        if (config.max_tokens) { max_tokens = parseInt(config.max_tokens) }

        let attitude: string = "professional"
        if (config.attitude) { attitude = config.attitude }


        let resultHtml: string = ""
        let resultJson: string = "";
        let resultObject: any = {}

        trace.log(modelName, prompt)

        if (!silent) {console.log("Starting ")}

        let result: string = "";
        let model: any
        try {
                if (apiService == "gemini") {
                        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                        model = await genAI.getGenerativeModel({ model: modelName });
                        const rawResult = await await model.generateContent(prompt);
                        trace.log(rawResult);
                        if (!rawResult.response.text()) { throw new Error('Fetch from Gemini failed') }
                        result = rawResult.response.text()
                }

                if (apiService == "openai") {
                        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
                        let openapiParms: OpenAI.Chat.ChatCompletionCreateParams;
                        openapiParms = {
                                model: modelName,
                                messages: [
                                        { "role": "system", "content": "Professional" },
                                        { "role": "user", "content": prompt },
                                ],
                                temperature: temperature,
                        }
                        trace.log(openapiParms)

                        const completion: any = await openai.chat.completions.create(openapiParms);
                        trace.log(completion)
                        if (!completion.choices[0].message.content) { throw new Error('Fetch from openai failed') }
                        result = completion.choices[0].message.content;
                }

                if (apiService == "claude") {
                        let claudeParms: any = {
                                model: modelName,
                                max_tokens: max_tokens,
                                messages: [{
                                        role: "user",
                                        content: prompt
                                }]
                        }

                        const message = await withRetry(async () => {
                                const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
                                const response: any = await anthropic.messages.create(claudeParms);
                                trace.log(response);
                                if (!response?.content?.[0]?.text) {
                                        throw new Error('Invalid response format from Claude API');
                                }
                                return response;
                        });
                        trace.log(message.content[0])
                        result = message.content[0].text;
                }
        } catch (error) {
                result = "Error"
                resultObject.content = `Error: ${error}`;
                console.error('Error:', error);
        }

        trace.log(result)

        if (result != "Error") {

                if (!silent) {console.log("Looking for formatted data")}
                resultObject.content = result;
                let any=false;
                while (true) {
                        const temp: string[] | null = result.match(/```(.*?)```/s)
                        if (temp) {
                                trace.log(temp)
                                const start: string[] | null = temp[0].match(/```(.*?)\n/s)
                                if (start) {
                                        trace.log(start[0])
                                        const type = start[0].replace('```', '').trim()
                                        trace.log(type[0])
                                        if (!silent) {console.log(`******** Extracting ${type} ***********`)}
                                        const content = temp[0].replace(start[0], '').replace('```', '')
                                        trace.log(content)
                                        resultObject[type] = content;
                                        result = result.replace(temp[0], '')
                                        any=true;
                                }
                        }
                        else {
                                if (any && !silent){console.log('No more formatted data')} else {console.log('No formatted data found')}
                                break;  // no more formatted
                        }
                }

                resultObject.comments = result;
        }
        trace.log('returning', resultObject)
        return resultObject;

}


export { api }

