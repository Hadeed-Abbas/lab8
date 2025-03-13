const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');

const dataDir = path.join(__dirname, '..', 'data');
const eventsFile = path.join(dataDir, 'events.json');

// Only schedule cron job if not in CI environment
if (!process.env.CI) {
    try {
        cron.schedule('* * * * *', () => checkReminders());
        console.log('Cron job scheduled successfully');
    } catch (error) {
        console.error('Failed to schedule cron job:', error);
    }
} else {
    console.log('Running in CI environment, skipping cron job scheduling');
}

async function ensureDataDirExists() {
    try {
        await fs.access(dataDir);
    } catch (error) {
        // Directory doesn't exist, create it
        await fs.mkdir(dataDir, { recursive: true });
    }
}

async function loadEvents() {
    try {
        await ensureDataDirExists();
        const data = await fs.readFile(eventsFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist, return empty structure
            return { users: {} };
        }
        console.error('Error loading events:', error);
        return { users: {} };
    }
}

async function saveEvents(events) {
    try {
        await ensureDataDirExists();
        await fs.writeFile(eventsFile, JSON.stringify(events, null, 2));
    } catch (error) {
        console.error('Error saving events:', error);
    }
}

async function createEvent(userId, { name, description, dateTime, category, reminderMinutes }) {
    const events = await loadEvents();
    if (!events.users[userId]) {
        events.users[userId] = [];
    }

    const event = {
        id: Date.now().toString(),
        name,
        description,
        dateTime: new Date(dateTime).toISOString(),
        category: category || 'General',
        reminderMinutes: reminderMinutes || 0,
        reminded: false
    };

    events.users[userId].push(event);
    await saveEvents(events);
    return event;
}

async function getEvents(userId, filter = {}) {
    const events = await loadEvents();
    if (!events.users[userId]) return [];

    let userEvents = events.users[userId];

    if (filter.category) {
        userEvents = userEvents.filter(e => e.category === filter.category);
    }
    if (filter.upcomingOnly) {
        userEvents = userEvents.filter(e => new Date(e.dateTime) > new Date());
    }

    userEvents.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    return userEvents;
}

async function checkReminders() {
    const events = await loadEvents();
    const now = new Date();

    for (const userId in events.users) {
        for (const event of events.users[userId]) {
            if (event.reminderMinutes && !event.reminded) {
                const eventTime = new Date(event.dateTime);
                const reminderTime = new Date(eventTime - event.reminderMinutes * 60000);
                
                if (now >= reminderTime && now < eventTime) {
                    console.log(`Reminder for ${userId}: ${event.name} is happening soon!`);
                    event.reminded = true;
                }
            }
        }
    }
    await saveEvents(events);
}

async function authenticateUser(username, password) {
    const users = {
        'user1': 'pass123',
        'user2': 'pass456'
    };
    return users[username] === password ? username : null;
}

module.exports = {
    createEvent,
    getEvents,
    authenticateUser,
    checkReminders
};