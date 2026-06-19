const fs = require('fs');
const https = require('https');

async function checkGroq() {
  try {
    let envContent = '';
    try {
      envContent = fs.readFileSync('.env.local', 'utf8');
    } catch (e) {
      console.log('No .env.local found');
      return;
    }
    
    const keyMatch = envContent.match(/GROQ_API_KEY=(.+)/);
    if (!keyMatch) {
      console.log('No GROQ_API_KEY in .env.local');
      return;
    }
    
    let apiKey = keyMatch[1].trim();
    if (apiKey.startsWith('"') && apiKey.endsWith('"')) {
      apiKey = apiKey.slice(1, -1);
    }
    
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: "Test" }]
      })
    });
    
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
    
  } catch (err) {
    console.error("Error:", err);
  }
}

checkGroq();
