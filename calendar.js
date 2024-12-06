// Store tasks for each day
// Load tasks from localStorage if available
const tasks = JSON.parse(localStorage.getItem('tasks')) || {}; // Default to empty object if no tasks are saved

// References to popup elements
const taskPopup = document.getElementById('task-popup');
const taskContent = document.getElementById('task-content');
const taskDateElement = document.getElementById('task-date');
const taskList = document.getElementById('task-list');
const taskInput = document.getElementById('task-input');
const addTaskButton = document.getElementById('add-task');
const removeTaskButton = document.getElementById('remove-task');
const closePopupButton = document.getElementById('close-popup');



const calendar = document.getElementById('calendar');
const monthTitle = document.getElementById('month-title');
const daysContainer = document.getElementById('days');
const prevButton = document.getElementById('prev');
const nextButton = document.getElementById('next');

let today = new Date();
let timeline = generateTimeline(today, 2, 4);


function generateTimeline(referenceDate, pastMonths, futureMonths) {
    let timeline = [];
    let date = new Date(referenceDate);

    // Generate past months
    for (let i = pastMonths; i > 0; i--) {
        const pastMonthDate = new Date(date.getFullYear(), date.getMonth() - i, 1);
        const daysInMonth = new Date(pastMonthDate.getFullYear(), pastMonthDate.getMonth() + 1, 0).getDate();
        const month = [];

        for (let d = 1; d <= daysInMonth; d++) {
            month.push(new Date(pastMonthDate.getFullYear(), pastMonthDate.getMonth(), d));
        }

        timeline.push(month);
    }

    // Generate current and future months
    for (let i = 0; i <= futureMonths; i++) {
        const futureMonthDate = new Date(date.getFullYear(), date.getMonth() + i, 1);
        const daysInMonth = new Date(futureMonthDate.getFullYear(), futureMonthDate.getMonth() + 1, 0).getDate();
        const month = [];

        for (let d = 1; d <= daysInMonth; d++) {
            month.push(new Date(futureMonthDate.getFullYear(), futureMonthDate.getMonth(), d));
        }

        timeline.push(month);
    }

    return timeline;
}

function updateTimeline() {
    const oldestMonth = timeline.shift(); // Remove the oldest month
    const lastMonth = timeline[timeline.length - 1];
    const lastDate = lastMonth[lastMonth.length - 1];
    const newMonth = [];
    let nextMonthDate = new Date(lastDate);
    nextMonthDate.setDate(1); // Start from the first day of the next month
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

    const daysInNewMonth = new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1, 0).getDate();

    for (let d = 1; d <= daysInNewMonth; d++) {
        newMonth.push(new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), d));
    }

    timeline.push(newMonth);
}

function nextDay() {
    today.setDate(today.getDate() + 1);
    if (today > timeline[0][timeline[0].length - 1]) {
        updateTimeline();
    }
}

let currentMonthIndex = 0;


// Render the calendar and attach event listeners to days
function renderCalendar(monthIndex) {
    daysContainer.innerHTML = '';
    const currentMonth = timeline[monthIndex];
    monthTitle.textContent = currentMonth[0].toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
    });

    const currentYear = currentMonth[0].getFullYear();
    currentMonth.forEach(date => {
        const dayElement = document.createElement('div');
        dayElement.className = 'day';
        dayElement.textContent = date.getDate();

        if (date.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }

        // Add event listener to open the popup when a day is clicked
        dayElement.addEventListener('click', () => {
            openPopup(currentYear, date.getMonth(), date.getDate());
        });

        // Add the circle indicator based on task existence
        const dateKey = `${currentYear}-${date.getMonth() + 1}-${date.getDate()}`;
        const hasIncompleteTasks = tasks[dateKey] && tasks[dateKey].length > 0;
        const circleIndicator = document.createElement('div');
        circleIndicator.className = 'circle-indicator';
        circleIndicator.style.display = hasIncompleteTasks ? 'block' : 'none';
        dayElement.appendChild(circleIndicator);

        daysContainer.appendChild(dayElement);
    });
}



prevButton.addEventListener('click', () => {
    if (currentMonthIndex > 0) {
        currentMonthIndex--;
        renderCalendar(currentMonthIndex);
    }
});

nextButton.addEventListener('click', () => {
    if (currentMonthIndex < timeline.length - 1) {
        currentMonthIndex++;
        renderCalendar(currentMonthIndex);
    }
});

// Automatically update the calendar daily
setInterval(() => {
    nextDay();
    renderCalendar(currentMonthIndex);
}, 24 * 60 * 60 * 1000); // Adjust for daily updates

renderCalendar(currentMonthIndex);





// Open the task popup for a selected date
function openPopup(year, month, day) {
    const dateKey = `${year}-${month + 1}-${day}`; // Format the date as "YYYY-MM-DD"
    const selectedDate = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Remove time to compare dates

    taskDateElement.textContent = selectedDate.toLocaleDateString();

    // Check if the selected date is in the past
    const isPastDate = selectedDate < today;

    // Disable task inputs and buttons for past dates
    document.getElementById('task-name').disabled = isPastDate;
    document.getElementById('task-input').disabled = isPastDate;
    addTaskButton.disabled = isPastDate;
    removeTaskButton.disabled = isPastDate;

    if (isPastDate) {
        taskList.innerHTML = '<p>You cannot add tasks to past dates.</p>';
    } else {
        // Render tasks for the selected day
        renderTasks(dateKey);
    }

    // Show the popup
    taskPopup.classList.add('visible');

    // Add task event listener
    addTaskButton.onclick = () => {
        const taskName = document.getElementById('task-name').value.trim();
        const taskText = taskInput.value.trim();
        if (taskName && taskText) {
            if (!tasks[dateKey]) {
                tasks[dateKey] = [];
            }
            tasks[dateKey].push({ name: taskName, text: taskText });
            taskInput.value = '';
            renderTasks(dateKey);
            saveTasksToLocalStorage(); // Save tasks after adding

        }
    };

    // Remove all tasks event listener
    removeTaskButton.onclick = () => {
        delete tasks[dateKey];
        renderTasks(dateKey);
        saveTasksToLocalStorage(); // Save tasks after removal

    };
}

// Close the task popup
closePopupButton.onclick = () => {
    taskPopup.classList.remove('visible');
};

// Render the list of tasks for the selected date
function renderTasks(dateKey) {
    taskList.innerHTML = '';
    if (tasks[dateKey] && tasks[dateKey].length > 0) {
        tasks[dateKey].forEach((task, index) => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task-item';

            // Display name and task
            taskElement.innerHTML = `
                <strong>${task.name}:</strong> ${task.text}
                <button class="remove-task-btn" data-index="${index}">X</button>
            `;

            // Attach event listener to the remove button
            taskElement.querySelector('.remove-task-btn').addEventListener('click', () => {
                tasks[dateKey].splice(index, 1); // Remove task from array
                renderTasks(dateKey); // Re-render tasks
                saveTasksToLocalStorage(); // Save tasks after removal
            });

            taskList.appendChild(taskElement);
            // Mark the date with incomplete tasks
            updateCircleIndicator(dateKey, true);
        });
    } else {
        taskList.innerHTML = '<p>No tasks for this day.</p>';
        // Clear the indicator for completed or no tasks
        updateCircleIndicator(dateKey, false);

    }

}


// Focus task input when Enter is pressed in the name input
document.getElementById('task-name').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent the default action of the Enter key
        document.getElementById('task-input').focus();
    }
});

// Add task when Enter is pressed in the task input
document.getElementById('task-input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent the default action of the Enter key
        const taskName = document.getElementById('task-name').value.trim();
        const taskText = document.getElementById('task-input').value.trim();

        if (taskName && taskText) {
            const selectedDate = new Date(taskDateElement.textContent);
            const dateKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;            
            if (!tasks[dateKey]) {
                tasks[dateKey] = [];
            }
            tasks[dateKey].push({ name: taskName, text: taskText });
            document.getElementById('task-input').value = ''; // Clear task input
            saveTasksToLocalStorage();
            renderTasks(dateKey); // Re-render tasks
        } else if (!taskName) {
            alert("Please enter a name before adding a task.");
            document.getElementById('task-name').focus();
        }
    }
});



function updateCircleIndicator(dateKey, hasIncompleteTasks) {
    const dateParts = dateKey.split('-');
    const day = +dateParts[2];

    // Select day based on grid child position
    const dayCell = daysContainer.querySelector(`.day:nth-child(${day})`);

    if (dayCell) {
        const circleIndicator = dayCell.querySelector('.circle-indicator');
        if (circleIndicator) {
            circleIndicator.style.display = hasIncompleteTasks ? 'block' : 'none';
        }
    }
}

// Save tasks to localStorage
function saveTasksToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}


