// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDcDPz8X77m0s7EAUwpcpHgKKGsUz-wfzo",
  authDomain: "curanova-c39f7.firebaseapp.com",
  projectId: "curanova-c39f7",
  storageBucket: "curanova-c39f7.firebasestorage.app",
  messagingSenderId: "624941811143",
  appId: "1:624941811143:web:b6a2557609f7bbab6885e2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// State
let appData = {
    friends: ['Me'],
    meals: []
};

// Listen for Realtime Updates from Firebase
db.ref('messMateData').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        appData.friends = data.friends || ['Me'];
        // Ensure meals is correctly handled
        appData.meals = data.meals ? (Array.isArray(data.meals) ? data.meals : Object.values(data.meals)) : [];
    } else {
        saveData();
    }
    updateUI(); // Refresh UI instantly when data comes in
});

function saveData() {
    db.ref('messMateData').set(appData);
}

const MEAL_PRICES = {
    'Breakfast': 30,
    'Lunch': 60,
    'Dinner': 30,
    'Snacks': 20
};

// Navigation Elements
const navDashboard = document.getElementById('nav-dashboard');
const navDiary = document.getElementById('nav-diary');
const navFriends = document.getElementById('nav-friends');

const viewDashboard = document.getElementById('view-dashboard');
const viewDiary = document.getElementById('view-diary');
const viewFriends = document.getElementById('view-friends');

// DOM Elements
const logMealBtn = document.getElementById('log-meal-btn');
const logMealModal = document.getElementById('log-meal-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const logMealForm = document.getElementById('log-meal-form');

const addFriendBtnDash = document.getElementById('add-friend-btn-dash');
const addFriendBtnFull = document.getElementById('add-friend-btn-full');
const addFriendModal = document.getElementById('add-friend-modal');
const closeFriendModalBtn = document.getElementById('close-friend-modal-btn');
const addFriendForm = document.getElementById('add-friend-form');

const friendsCheckboxesEl = document.getElementById('friends-checkboxes');
const friendsExpenseListEl = document.getElementById('friends-expense-list');
const friendsFullListEl = document.getElementById('friends-full-list');
const dailyLogContainer = document.getElementById('daily-log-container');
const dailyLogDateInput = document.getElementById('daily-log-date');

const myTotalExpenseEl = document.getElementById('my-total-expense');
const totalMessExpenseEl = document.getElementById('total-mess-expense');


function initApp() {
    // Set default date to today
    const todayStr = new Date().toISOString().split('T')[0];
    document.getElementById('meal-date').value = todayStr;
    dailyLogDateInput.value = todayStr;
    
    // Set current month
    const options = { month: 'long', year: 'numeric' };
    document.getElementById('current-month').textContent = new Date().toLocaleDateString('en-US', options);

    dailyLogDateInput.addEventListener('change', renderDailyLog);

    setupEventListeners();
}

function updateUI() {
    renderFriendsCheckboxes();
    renderDailyLog();
    updateDashboard();
}

function switchTab(tabId) {
    viewDashboard.style.display = 'none';
    viewDiary.style.display = 'none';
    viewFriends.style.display = 'none';
    
    navDashboard.classList.remove('active');
    navDiary.classList.remove('active');
    navFriends.classList.remove('active');
    
    if (tabId === 'dashboard') {
        viewDashboard.style.display = 'block';
        navDashboard.classList.add('active');
    } else if (tabId === 'diary') {
        viewDiary.style.display = 'block';
        navDiary.classList.add('active');
    } else if (tabId === 'friends') {
        viewFriends.style.display = 'block';
        navFriends.classList.add('active');
    }
}

function updateDashboard() {
    let totalExpense = 0;
    let myExpense = 0;
    let friendExpenses = {};

    appData.friends.forEach(f => friendExpenses[f] = 0);

    appData.meals.forEach(meal => {
        const mealTotal = meal.price * meal.consumers.length;
        totalExpense += mealTotal;
        
        meal.consumers.forEach(consumer => {
            if (friendExpenses[consumer] !== undefined) {
                friendExpenses[consumer] += meal.price;
            }
            if (consumer === 'Me') {
                myExpense += meal.price;
            }
        });
    });

    myTotalExpenseEl.textContent = `₹${myExpense}`;
    totalMessExpenseEl.textContent = `₹${totalExpense}`;

    // Render Friends' Expenses
    friendsExpenseListEl.innerHTML = '';
    friendsFullListEl.innerHTML = '';
    
    const sortedFriends = [...appData.friends].sort((a, b) => friendExpenses[b] - friendExpenses[a]);

    if (sortedFriends.length <= 1) {
        friendsExpenseListEl.innerHTML = '<div class="empty-state">No friends added yet.</div>';
        friendsFullListEl.innerHTML = '<div class="empty-state">No friends added yet.</div>';
    }

    sortedFriends.forEach((friend) => {
        if (friend === 'Me') return; // Skip "Me"

        const exp = friendExpenses[friend];
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <div class="list-item-info">
                <span class="list-item-title">${friend}</span>
            </div>
            <span class="list-item-value">₹${exp}</span>
        `;
        
        friendsExpenseListEl.appendChild(item);
        friendsFullListEl.appendChild(item.cloneNode(true));
    });
}

function renderFriendsCheckboxes() {
    friendsCheckboxesEl.innerHTML = '';
    appData.friends.forEach(friend => {
        const label = document.createElement('label');
        label.className = 'checkbox-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = friend;
        checkbox.checked = true;
        checkbox.className = 'friend-checkbox';

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(friend));
        friendsCheckboxesEl.appendChild(label);
    });
}

function renderDailyLog() {
    dailyLogContainer.innerHTML = '';
    
    const selectedDate = dailyLogDateInput.value;
    const mealsOnDate = appData.meals.filter(meal => meal.date === selectedDate);

    if (mealsOnDate.length === 0) {
        dailyLogContainer.innerHTML = '<div class="empty-state">No meals logged on this date.</div>';
        return;
    }

    // Build map of friend -> meals they ate
    const friendMeals = {};
    appData.friends.forEach(f => friendMeals[f] = []);

    mealsOnDate.forEach(meal => {
        meal.consumers.forEach(c => {
            if (friendMeals[c]) {
                friendMeals[c].push(meal.type);
            }
        });
    });

    appData.friends.forEach(friend => {
        const mealsEaten = friendMeals[friend].length > 0 ? friendMeals[friend].join(', ') : 'Did not eat';
        const textColor = friendMeals[friend].length > 0 ? 'var(--text-main)' : 'var(--text-muted)';
        const expense = friendMeals[friend].reduce((acc, type) => acc + (MEAL_PRICES[type] || 0), 0);

        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <div class="list-item-info">
                <span class="list-item-title">${friend}</span>
                <span class="list-item-sub" style="color: ${textColor}">${mealsEaten}</span>
            </div>
            <span class="list-item-value" style="color: var(--accent);">₹${expense}</span>
        `;
        dailyLogContainer.appendChild(item);
    });
}

function setupEventListeners() {
    // Navigation
    navDashboard.addEventListener('click', (e) => { e.preventDefault(); switchTab('dashboard'); });
    navDiary.addEventListener('click', (e) => { e.preventDefault(); switchTab('diary'); });
    navFriends.addEventListener('click', (e) => { e.preventDefault(); switchTab('friends'); });

    // Modals
    logMealBtn.addEventListener('click', () => logMealModal.classList.add('active'));
    closeModalBtn.addEventListener('click', () => logMealModal.classList.remove('active'));
    
    addFriendBtnDash.addEventListener('click', () => addFriendModal.classList.add('active'));
    addFriendBtnFull.addEventListener('click', () => addFriendModal.classList.add('active'));
    closeFriendModalBtn.addEventListener('click', () => addFriendModal.classList.remove('active'));

    // Close on overlay click
    logMealModal.addEventListener('click', (e) => {
        if (e.target === logMealModal) logMealModal.classList.remove('active');
    });
    addFriendModal.addEventListener('click', (e) => {
        if (e.target === addFriendModal) addFriendModal.classList.remove('active');
    });

    // Forms
    logMealForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const date = document.getElementById('meal-date').value;
        const type = document.getElementById('meal-type').value;
        const price = MEAL_PRICES[type] || 0; // Price handles automatically
        
        const checkboxes = document.querySelectorAll('.friend-checkbox:checked');
        const consumers = Array.from(checkboxes).map(cb => cb.value);

        if (consumers.length === 0) {
            alert('Please select at least one person who ate the meal.');
            return;
        }

        const newMeal = {
            id: Date.now(),
            date,
            type,
            price,
            consumers
        };

        appData.meals.push(newMeal);
        saveData();
        
        logMealModal.classList.remove('active');
        logMealForm.reset();
        document.getElementById('meal-date').value = new Date().toISOString().split('T')[0];
    });

    addFriendForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('friend-name-input');
        const name = nameInput.value.trim();
        
        if (name && !appData.friends.includes(name)) {
            appData.friends.push(name);
            saveData();
            addFriendModal.classList.remove('active');
            nameInput.value = '';
        } else if (appData.friends.includes(name)) {
            alert('Friend already exists!');
        }
    });
}

// Start
document.addEventListener('DOMContentLoaded', initApp);
