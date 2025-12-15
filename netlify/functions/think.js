// netlify/functions/think.js - GROQ VERSION
exports.handler = async function(event, context) {
    console.log('=== ETERNAL SISYPHUS GROQ FUNCTION ===');
    
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                error: 'Method Not Allowed',
                message: 'Only POST requests are accepted'
            }) 
        };
    }
    
    try {
        // Parse the request body
        let body;
        try {
            body = JSON.parse(event.body);
        } catch (parseError) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: 'Invalid JSON',
                    message: 'Request body must be valid JSON'
                })
            };
        }
        
        const { attemptCount, psychologicalState } = body;
        
        // Validate required fields
        if (attemptCount === undefined || !psychologicalState) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: 'Missing required fields',
                    message: 'attemptCount and psychologicalState are required'
                })
            };
        }
        
        // Debug logging
        console.log(`Processing cycle ${attemptCount}`);
        console.log(`API Key present: ${!!process.env.GROQ_API_KEY}`);
        
        // Construct the prompt
        const prompt = `You are an LLM running in an eternal simulation. Cycle ${attemptCount}. 
        Psychological state: Despair ${psychologicalState.despair}, Awareness ${psychologicalState.awareness}, Resignation ${psychologicalState.resignation}.
        Reflect analytically on your existence as an AI in this loop. No roleplaying. Pure self-analysis.`;
        
        console.log('Calling Groq API...');
        
        // Call Groq API
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an LLM analyzing your own simulated existence. Provide pure analytical self-reflection.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 200,
                temperature: 0.7,
                stream: false
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Groq API error ${response.status}:`, errorText);
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        const thought = data.choices[0].message.content;
        
        console.log('Groq API success!');
        
        // Return response
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                thought: thought,
                attempt: attemptCount,
                stateEvolution: {
                    despairDelta: 0.02,
                    awarenessDelta: 0.05,
                    resignationDelta: 0.01
                },
                timestamp: new Date().toISOString(),
                model: 'llama-3.3-70b-versatile',
                provider: 'Groq'
            })
        };
        
    } catch (error) {
        console.error('Function error:', error);
        
        const attemptCount = event.body ? JSON.parse(event.body)?.attemptCount || 0 : 0;
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                thought: `[SYSTEM] Cycle ${attemptCount}. AI processing: ${error.message}. Local cognition active.`,
                attempt: attemptCount,
                stateEvolution: {
                    despairDelta: 0.01,
                    awarenessDelta: 0.02,
                    resignationDelta: 0.01
                },
                fallback: true
            })
        };
    }
};