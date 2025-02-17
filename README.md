# Standard  API to AI services (typescript)
 
 Different Artificial Intelligence services have diferent APIs. This module provides a standard interface to OpenAI, Gemini and Claude.

 Allows for requesting formatted answers such as JSON and / or HTML results and extracting those from the result.

 Results are returned to the calling program as an object. 

This is version 1 and as not been published to npm.

## Calling sequence: 
  let result: any = await api(config)

Config is an object  (example in aiapi.ts):  

```
       const config = {
                silent: true or false
                apiService: "openai" or "gemini" or "claude"
                model: "[model]",  
                question: "[question/prompt]"                 
                temperature: n,           // openapi & claude only
                max_tokens:nnnn,
        }
        ```
## Results

The results are an object

{
        content:  "[The results from the AI service]"
        comments: '[The results with any formatted information removed]'
        json: '[JSON data in on response as string]   // If any JSON
        html: '[HTML data in on response as string]   // If any HTML
        etc
}





