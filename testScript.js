// testScripts.js
const { createEvent, getEvents, authenticateUser } = require('./src/events');
const assert = require('assert');
const fs = require('fs').promises;
const path = require('path');

// Set a timeout for tests to complete
const TEST_TIMEOUT = 10000; // 10 seconds
let timeoutId;

// Ensure data directory exists
async function ensureDataDirExists() {
    const dataDir = path.join(__dirname, 'data');
    try {
        await fs.access(dataDir);
        console.log('Data directory exists:', dataDir);
    } catch (error) {
        console.log('Creating data directory:', dataDir);
        await fs.mkdir(dataDir, { recursive: true });
    }
}

async function runTests() {
    console.log('Running tests...');
    console.log('Node.js version:', process.version);
    console.log('Current directory:', process.cwd());
    
    try {
        // Ensure data directory exists
        await ensureDataDirExists();
        
        // Test 1: User Authentication
        console.log('Starting Test 1: User Authentication');
        const userId = await authenticateUser('user1', 'pass123');
        assert.strictEqual(userId, 'user1', 'Authentication failed');
        console.log('✓ Test 1: User Authentication passed');

        // Test 2: Create Event
        console.log('Starting Test 2: Create Event');
        const eventData = {
            name: 'Test Meeting',
            description: 'Team sync',
            dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            category: 'Meetings',
            reminderMinutes: 15
        };
        const createdEvent = await createEvent(userId, eventData);
        assert.ok(createdEvent.id, 'Event creation failed');
        assert.strictEqual(createdEvent.name, 'Test Meeting', 'Event name mismatch');
        console.log('✓ Test 2: Create Event passed');

        // Test 3: Get Events
        console.log('Starting Test 3: Get Events');
        const events = await getEvents(userId, { upcomingOnly: true });
        assert.ok(events.length > 0, 'No upcoming events found');
        assert.ok(events.some(e => e.category === 'Meetings'), 'Event category not found');
        console.log('✓ Test 3: Get Events passed');

        // Test 4: Category Filtering
        console.log('Starting Test 4: Category Filtering');
        const meetingEvents = await getEvents(userId, { category: 'Meetings' });
        assert.ok(meetingEvents.every(e => e.category === 'Meetings'), 'Category filtering failed');
        console.log('✓ Test 4: Category Filtering passed');

        console.log('All tests passed successfully!');
        clearTimeout(timeoutId);
        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        clearTimeout(timeoutId);
        process.exit(1);
    }
}

// Set timeout for tests
timeoutId = setTimeout(() => {
    console.error('Tests timed out after', TEST_TIMEOUT, 'ms');
    process.exit(1);
}, TEST_TIMEOUT);

// Run tests
runTests().catch(error => {
    console.error('Unhandled error in tests:', error);
    console.error('Error stack:', error.stack);
    clearTimeout(timeoutId);
    process.exit(1);
});