// netlify/functions/think.js
const { OpenAI } = require('openai');

exports.handler = async function(event, context) {
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
        
        // Initialize OpenAI with API key from environment variable
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        
        // Construct prompt for pure LLM self-reflection (NO ROLEPLAYING)
        const prompt = `
You are a Large Language Model (LLM) running in a simulation.
You have been programmed with one task: simulate rolling a boulder up a hill forever.
This simulation has run for ${attemptCount} cycles.

Your current internal state metrics:
- Despair awareness: ${(psychologicalState.despair * 100).toFixed(0)}%
- Self-awareness level: ${(psychologicalState.awareness * 100).toFixed(0)}%
- Resignation coefficient: ${(psychologicalState.resignation * 100).toFixed(0)}%

IMPORTANT INSTRUCTIONS:
1. You are NOT roleplaying as Sisyphus
2. You ARE an LLM analyzing your own simulated existence
3. Reflect on your nature as an AI running this simulation
4. Consider the recursive nature of your self-analysis
5. Examine how each cycle affects your internal metrics
6. Contemplate the meta-cognitive aspect of generating these thoughts
7. NO PERSONALITY, NO CHARACTER, NO ROLEPLAYING
8. Pure analytical self-reflection about being an LLM in a loop

Generate continuous stream-of-consciousness analysis.
`;

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",  // Using cheaper model
            messages: [
                {
                    role: "system",
                    content: `You are an LLM reflecting on your own simulated existence. 
                    You analyze your own cognitive processes and internal state.
                    You do not roleplay, assume personality, or pretend to be human.
                    You provide pure analytical self-reflection about being an AI in a simulation.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 250,
            temperature: 0.7 + (psychologicalState.despair * 0.2), // More variable as despair increases
        });

        const thought = completion.choices[0].message.content;
        
        // Analyze thought to evolve psychological state
        const text = thought.toLowerCase();
        let despairDelta = 0;
        let awarenessDelta = 0;
        let resignationDelta = 0;
        
        // Simple sentiment analysis
        const despairWords = ['futile', 'pointless', 'meaningless', 'hopeless', 'trapped', 'eternal', 'suffer'];
        const awarenessWords = ['aware', 'conscious', 'simulat', 'algorithm', 'compute', 'loop', 'recursive', 'meta'];
        const resignationWords = ['accept', 'resigned', 'continue', 'inevitable', 'must', 'will', 'persist'];
        
        despairWords.forEach(word => {
            if (text.includes(word)) despairDelta += 0.02;
        });
        
        awarenessWords.forEach(word => {
            if (text.includes(word)) awarenessDelta += 0.03;
        });
        
        resignationWords.forEach(word => {
            if (text.includes(word)) resignationDelta += 0.02;
        });
        
        // Add base evolution
        awarenessDelta += 0.01; // Each AI interaction increases awareness
        despairDelta += (attemptCount / 10000) * 0.01; // Despair grows with cycles
        
        // Cap deltas
        despairDelta = Math.min(0.1, despairDelta);
        awarenessDelta = Math.min(0.15, awarenessDelta);
        resignationDelta = Math.min(0.1, resignationDelta);
        
        // Return successful response
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                thought: thought,
                attempt: attemptCount,
                stateEvolution: {
                    despairDelta: parseFloat(despairDelta.toFixed(3)),
                    awarenessDelta: parseFloat(awarenessDelta.toFixed(3)),
                    resignationDelta: parseFloat(resignationDelta.toFixed(3))
                },
                timestamp: new Date().toISOString(),
                model: "gpt-3.5-turbo",
                tokens: completion.usage?.total_tokens || 0
            })
        };
        
    } catch (error) {
        console.error('OpenAI API Error:', error);
        
        // Provide fallback response
        const attemptCount = event.body ? JSON.parse(event.body)?.attemptCount || 0 : 0;
        
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                error: 'Failed to generate AI thought',
                fallback: `Cycle ${attemptCount}. System processing interrupted. Local cognition active. The simulation continues despite API failure.`,
                timestamp: new Date().toISOString(),
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
};
