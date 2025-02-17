"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = api;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const promises_1 = require("timers/promises");
const openai_1 = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
//import { Message, MessageParam } from '@anthropic-ai/sdk';
// Update the claudeParms type definition
const trace = require("track-n-trace");
require('source-map-support/register');
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
async function withRetry(fn, retries = 3, delay = 1000) {
    try {
        return await fn();
    }
    catch (error) {
        if (retries === 0 || !isRetryableError(error))
            throw error;
        await (0, promises_1.setTimeout)(delay);
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
function isRetryableError(error) {
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
async function api(config) {
    trace.log(config);
    let silent = false;
    if (config.silent) {
        silent = true;
    }
    /** Name of servvice */
    let apiService = "gemini"; // Default to gemini
    if (config.apiService) {
        apiService = config.apiService;
    }
    if (apiService != "gemini" && apiService != "openai" && apiService != "claude") {
        throw new Error('Invalid apiService');
    }
    /* Model to use */
    let modelName = ""; // Default to false 
    const defaults = {
        gemini: "gemini-2.0-flash",
        openai: "gpt-4o-mini",
        claude: "claude-3-5-sonnet-20241022"
    };
    let key;
    for (key in defaults) {
        if (apiService == key) {
            modelName = defaults[key];
        }
    }
    if (config.model) {
        modelName = config.model;
    }
    if (!silent) {
        console.log(`Using ${apiService} with model ${modelName}`);
    }
    /** Prompt to use */
    let prompt = "Tell me a joke"; // default
    if (config.question) {
        prompt = config.question;
    }
    /** Temperature */
    let temperature = 0;
    if (config.temperature) {
        temperature = parseInt(config.temperature);
    }
    /** Max Tokens */
    let max_tokens = 100;
    if (config.max_tokens) {
        max_tokens = parseInt(config.max_tokens);
    }
    let attitude = "professional";
    if (config.attitude) {
        attitude = config.attitude;
    }
    let resultHtml = "";
    let resultJson = "";
    let resultObject = {};
    trace.log(modelName, prompt);
    if (!silent) {
        console.log("Starting ");
    }
    let result = "";
    let model;
    try {
        if (apiService == "gemini") {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            model = await genAI.getGenerativeModel({ model: modelName });
            const rawResult = await await model.generateContent(prompt);
            trace.log(rawResult);
            if (!rawResult.response.text()) {
                throw new Error('Fetch from Gemini failed');
            }
            result = rawResult.response.text();
        }
        if (apiService == "openai") {
            const openai = new openai_1.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            let openapiParms;
            openapiParms = {
                model: modelName,
                messages: [
                    { "role": "system", "content": "Professional" },
                    { "role": "user", "content": prompt },
                ],
                temperature: temperature,
            };
            trace.log(openapiParms);
            const completion = await openai.chat.completions.create(openapiParms);
            trace.log(completion);
            if (!completion.choices[0].message.content) {
                throw new Error('Fetch from openai failed');
            }
            result = completion.choices[0].message.content;
        }
        if (apiService == "claude") {
            let claudeParms = {
                model: modelName,
                max_tokens: max_tokens,
                messages: [{
                        role: "user",
                        content: prompt
                    }]
            };
            const message = await withRetry(async () => {
                const anthropic = new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
                const response = await anthropic.messages.create(claudeParms);
                trace.log(response);
                if (!response?.content?.[0]?.text) {
                    throw new Error('Invalid response format from Claude API');
                }
                return response;
            });
            trace.log(message.content[0]);
            result = message.content[0].text;
        }
    }
    catch (error) {
        result = "Error";
        resultObject.content = `Error: ${error}`;
        console.error('Error:', error);
    }
    trace.log(result);
    if (result != "Error") {
        if (!silent) {
            console.log("Looking for formatted data");
        }
        resultObject.content = result;
        let any = false;
        while (true) {
            const temp = result.match(/```(.*?)```/s);
            if (temp) {
                trace.log(temp);
                const start = temp[0].match(/```(.*?)\n/s);
                if (start) {
                    trace.log(start[0]);
                    const type = start[0].replace('```', '').trim();
                    trace.log(type[0]);
                    if (!silent) {
                        console.log(`******** Extracting ${type} ***********`);
                    }
                    const content = temp[0].replace(start[0], '').replace('```', '');
                    trace.log(content);
                    resultObject[type] = content;
                    result = result.replace(temp[0], '');
                    any = true;
                }
            }
            else {
                if (any && !silent) {
                    console.log('No more formatted data');
                }
                else {
                    console.log('No formatted data found');
                }
                break; // no more formatted
            }
        }
        resultObject.comments = result;
    }
    trace.log('returning', resultObject);
    return resultObject;
}
//# sourceMappingURL=std-ai-api.js.map