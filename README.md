# Standard  API to AI services (typescript)
 
 Different Artificial Intelligence services have diferent APIs. This module provides a standard interface to OpenAI, Gemini and Claude.

 Allows for requesting formatted answers such as JSON and / or HTML results and extracting those from the result.

 Results are returned to the calling program as an object. 

This is version 1 and as not been published to npm. Yet to add other parameters such as  top_p, stop, freqency_penalty and so on.

There is an example of its use in aiapi.ts



## Calling sequence: 

  import { api } from "./std-ai-api"
  let result: any = await api(config)

Config is an object as follows:  

```
       const config = {
                silent: true or false                         // Stop console progress messagesp
                apiService: "[service]                        // "openai" or "gemini" or "claude"
                model: "[model]",                             // depending on service
                question: "[question/prompt]"                 
                temperature: n,                               // openapi & claude only
                max_tokens:nnnn,
        }
        ```
The  API key should be in the .env file. The codes are 
OPENAI_API_KEY      OpenAI
GEMINI_API_KEY      Gemini
ANTHROPIC_API_KEY   Claude     

## Results

The results are an object:

```typescript
{
        content:  string;    // The complete results from the AI service
        comments: string;    // The results with any formatted information removed
        json?: string;      // JSON data in response (if any)
        html?: string;      // HTML data in response (if any)
}
```
        The results are an object


{
        content:  "[The results from the AI service]"
        comments: "[The results with any formatted information removed]"
        json: "[JSON data in response as string]"   // If any JSON
        html: "[HTML data in response as string]"   // If any HTML
        etc
}





