async function test() {
  try {
    const response = await fetch('http://localhost:3500/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            message: "I am looking for a tour. Experience: Adventure. Budget: Premium ($1000+). Duration: 1 week+. Please recommend the best matching tour from the available packages.",
            isRecommendation: true
        })
    });
    const data = await response.json();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}
test();
