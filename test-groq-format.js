const fs = require('fs');

async function testGroqFormat(format) {
  const formData = new FormData();
  // Create a dummy audio blob
  const blob = new Blob(["dummy audio data"], { type: "audio/mp3" });
  formData.append("file", blob, "dummy.mp3");
  formData.append("model", "whisper-large-v3-turbo");
  formData.append("response_format", format);

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY || 'gsk_dummy'}` // Need the actual key, but even with dummy it should return 401 instead of 400 if format is valid. Wait, 401 happens before 400 usually.
    },
    body: formData
  });

  const data = await res.json().catch(()=>({}));
  console.log(`Format ${format} -> Status: ${res.status}`, data);
}

testGroqFormat("srt");
