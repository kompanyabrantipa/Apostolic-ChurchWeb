// Test script to verify API connectivity
(async function() {
  try {
    console.log('Testing API connectivity...');
    
    // Test public blog endpoint
    const blogResponse = await fetch('https://api.apostolicchurchlouisville.org/api/blog/public');
    const blogData = await blogResponse.json();
    console.log('Blog API Response:', blogResponse.status, blogData);
    
    // Test events endpoint
    const eventsResponse = await fetch('https://api.apostolicchurchlouisville.org/api/events/public');
    const eventsData = await eventsResponse.json();
    console.log('Events API Response:', eventsResponse.status, eventsData);
    
    // Test sermons endpoint
    const sermonsResponse = await fetch('https://api.apostolicchurchlouisville.org/api/sermons/public');
    const sermonsData = await sermonsResponse.json();
    console.log('Sermons API Response:', sermonsResponse.status, sermonsData);
    
    console.log('API connectivity test completed');
  } catch (error) {
    console.error('API connectivity test failed:', error);
  }
})();