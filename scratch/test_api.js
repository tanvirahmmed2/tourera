const axios = require('axios');
async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/control/packages', {
      headers: {
        // Need to simulate a cookie or something? 
        // Oh wait, the route has `isManager()` which requires auth.
        // I can just call the route function directly via node!
      }
    });
  } catch(e) {}
}
