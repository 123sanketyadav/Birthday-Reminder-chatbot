// Store birthdays in localStorage
let birthdays = JSON.parse(localStorage.getItem('birthdays')) || [];

// Gift suggestions
const giftSuggestions = {
    'general': [
        'Personalized photo frame',
        'Gourmet chocolate box',
        'Scented candles set',
        'Customized mug',
        'Wireless earbuds'
    ],
    'tech': [
        'Smart home device',
        'Portable charger',
        'Wireless charging pad',
        'VR headset',
        'Smart watch'
    ],
    'books': [
        'Bestselling novel',
        'E-reader',
        'Book subscription box',
        'Reading light',
        'Bookstore gift card'
    ]
};

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Initialize chat
function initializeChat() {
    // Add event listeners
    sendButton.addEventListener('click', handleUserInput);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserInput();
        }
    });

    // Focus input field
    userInput.focus();
}

// Handle user input
function handleUserInput() {
    const message = userInput.value.trim();
    if (message) {
        addMessage(message, 'user');
        processUserInput(message);
        userInput.value = '';
        userInput.focus();
    }
}

// Add message to chat
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    messageDiv.innerHTML = `<p>${text}</p>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Process user input and generate response
function processUserInput(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('add birthday') || lowerMessage.includes('new birthday')) {
        addMessage("Please provide the person's name and birthday in the format: 'Name - MM/DD/YYYY'", 'bot');
    } else if (lowerMessage.includes(' - ')) {
        addBirthday(message);
    } else if (lowerMessage.includes('list') || lowerMessage.includes('show birthdays')) {
        showBirthdays();
    } else if (lowerMessage.includes('gift') || lowerMessage.includes('suggestion')) {
        provideGiftSuggestions(message);
    } else if (lowerMessage.includes('likes:')) {
        addInterests(message);
    } else if (lowerMessage.includes('help')) {
        showHelp();
    } else {
        addMessage("I'm not sure I understand. You can try:\n- Adding a birthday (e.g., 'add birthday')\n- Listing birthdays (e.g., 'show birthdays')\n- Getting gift suggestions (e.g., 'suggest gifts')\n- Type 'help' for more information", 'bot');
    }
}

// Add new birthday
function addBirthday(message) {
    const [name, date] = message.split(' - ');
    if (!name || !date || !isValidDate(date)) {
        addMessage("Please use the correct format: 'Name - MM/DD/YYYY'", 'bot');
        return;
    }
    
    const birthday = {
        name: name.trim(),
        date: date.trim(),
        interests: []
    };
    birthdays.push(birthday);
    localStorage.setItem('birthdays', JSON.stringify(birthdays));
    addMessage(`Added birthday for ${name} on ${date}. Would you like to add any interests for better gift suggestions? Just type: "${name} likes: interest1, interest2"`, 'bot');
}

// Validate date format
function isValidDate(dateStr) {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(dateStr)) return false;
    
    const [month, day, year] = dateStr.split('/').map(num => parseInt(num, 10));
    const date = new Date(year, month - 1, day);
    
    return date.getMonth() === month - 1 && 
           date.getDate() === day && 
           date.getFullYear() === year;
}

// Show all birthdays
function showBirthdays() {
    if (birthdays.length === 0) {
        addMessage("You haven't added any birthdays yet. Use 'add birthday' to add one.", 'bot');
        return;
    }

    let response = "Here are the saved birthdays:\n";
    birthdays.forEach((birthday, index) => {
        const nextBirthday = getNextBirthday(birthday.date);
        const daysUntil = getDaysUntil(nextBirthday);
        response += `${index + 1}. ${birthday.name}: ${birthday.date} (${daysUntil} days away)\n`;
    });
    addMessage(response, 'bot');
}

// Calculate next birthday
function getNextBirthday(dateStr) {
    const [month, day, year] = dateStr.split('/').map(num => parseInt(num, 10));
    const today = new Date();
    const nextBirthday = new Date(today.getFullYear(), month - 1, day);
    
    if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    
    return nextBirthday;
}

// Calculate days until date
function getDaysUntil(date) {
    const today = new Date();
    const timeDiff = date - today;
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
}

// Add interests to a person
function addInterests(message) {
    const [namePart, interestsPart] = message.split('likes:');
    const name = namePart.trim();
    const interests = interestsPart.split(',').map(interest => interest.trim().toLowerCase());
    
    const person = birthdays.find(b => b.name.toLowerCase() === name.toLowerCase());
    
    if (!person) {
        addMessage(`I couldn't find a birthday entry for ${name}. Please add the birthday first.`, 'bot');
        return;
    }
    
    person.interests = interests;
    localStorage.setItem('birthdays', JSON.stringify(birthdays));
    addMessage(`Added interests for ${name}: ${interests.join(', ')}. You can now get personalized gift suggestions!`, 'bot');
}

// Provide gift suggestions
function provideGiftSuggestions(message) {
    let suggestions = [...giftSuggestions.general];
    const lowerMessage = message.toLowerCase();
    
    // Check for specific person
    const person = birthdays.find(b => lowerMessage.includes(b.name.toLowerCase()));
    
    if (person) {
        if (person.interests && person.interests.length > 0) {
            person.interests.forEach(interest => {
                if (giftSuggestions[interest]) {
                    suggestions = [...suggestions, ...giftSuggestions[interest]];
                }
            });
        }
    } else {
        // Add category-specific suggestions based on message
        if (lowerMessage.includes('tech')) suggestions = [...suggestions, ...giftSuggestions.tech];
        if (lowerMessage.includes('book')) suggestions = [...suggestions, ...giftSuggestions.books];
    }

    // Randomly select 5 suggestions
    const randomSuggestions = suggestions
        .sort(() => 0.5 - Math.random())
        .slice(0, 5);

    let response = person 
        ? `Here are some gift suggestions for ${person.name}:\n`
        : "Here are some general gift suggestions:\n";
    
    randomSuggestions.forEach((suggestion, index) => {
        response += `${index + 1}. ${suggestion}\n`;
    });
    addMessage(response, 'bot');
}

// Show help message
function showHelp() {
    const helpMessage = `Here's what I can do:
1. Add a birthday: Type "add birthday" and follow the format "Name - MM/DD/YYYY"
2. List birthdays: Type "list birthdays" or "show birthdays"
3. Get gift suggestions: Type "gift suggestions" or "suggest gifts for [name]"
4. Add interests: After adding a birthday, type "[name] likes: interest1, interest2"
5. Get help: Type "help" anytime

Example commands:
- "add birthday"
- "John - 12/25/1990"
- "John likes: tech, books"
- "suggest gifts for John"
- "list birthdays"`;

    addMessage(helpMessage, 'bot');
}

// Create sparkling effect
function createSparkles() {
    const sparkleCount = 50;
    const container = document.body;
    
    for (let i = 0; i < sparkleCount; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        
        // Random position
        sparkle.style.left = Math.random() * 100 + 'vw';
        sparkle.style.top = Math.random() * 100 + 'vh';
        
        // Random size
        const size = Math.random() * 3 + 1;
        sparkle.style.width = size + 'px';
        sparkle.style.height = size + 'px';
        
        // Random animation delay
        sparkle.style.animationDelay = Math.random() * 3 + 's';
        
        container.appendChild(sparkle);
    }
}

// Initialize the chat and create sparkles when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeChat();
    createSparkles();
}); 