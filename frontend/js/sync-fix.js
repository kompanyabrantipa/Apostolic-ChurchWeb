// Add this to your page to test content sync
function testContentSync() {
    console.log('Testing content sync...');
    
    // Create a test event
    const testEvent = new CustomEvent('contentSync', {
        detail: {
            contentType: 'all',
            action: 'update',
            timestamp: Date.now()
        }
    });
    
    // Dispatch the event
    window.dispatchEvent(testEvent);
    console.log('Content sync event dispatched');
    
    return 'Content sync test complete. Check if content was reloaded.';
}

// Run this in console:
// testContentSync()