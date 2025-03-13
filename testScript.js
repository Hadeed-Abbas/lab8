// testScripts.js
const { createEvent, getEvents, authenticateUser } = require('./src/events');
const assert = require('assert');

async function runTests() {
    console.log('Running tests...');

    try {
        const userId = await authenticateUser('user1', 'pass123');
        assert.strictEqual(userId, 'user1', 'Authentication failed');
        console.log('Test 1: User Authentication passed');

        const eventData = {
            name: 'Test Meeting',
            description: 'Team sync',
            dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), 
            category: 'Meetings',
            reminderMinutes: 15
        };
        const createdEvent = await createEvent(userId, eventData);
        assert.ok(createdEvent.id, 'Event creation failed');
        assert.strictEqual(createdEvent.name, 'Test Meeting', 'Event name mismatch');
        console.log('Test 2: Create Event passed');

        const events = await getEvents(userId, { upcomingOnly: true });
        assert.ok(events.length > 0, 'No upcoming events found');
        assert.ok(events.some(e => e.category === 'Meetings'), 'Event category not found');
        console.log('Test 3: Get Events passed');

        const meetingEvents = await getEvents(userId, { category: 'Meetings' });
        assert.ok(meetingEvents.every(e => e.category === 'Meetings'), 'Category filtering failed');
        console.log('Test 4: Category Filtering passed');

        console.log('All tests passed successfully!');
    } catch (error) {
        console.error('Test failed:', error.message);
        process.exit(1);
    }
}

runTests().catch(console.error);