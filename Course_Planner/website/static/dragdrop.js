let accumulatedCredits = 0;

function updateDisplayedCredits() {
    const accumulatedCreditsElement = document.getElementById("accumulated-credits");
    if (accumulatedCreditsElement) {
        accumulatedCreditsElement.innerText = "Credits: " + accumulatedCredits;
    }
}

function incrementCreditsBy(value) {
    accumulatedCredits += value;
    updateDisplayedCredits();
}

function decrementCredits(el) {
    accumulatedCredits -= 6;
    updateDisplayedCredits();
}

function revertDrag(el) {
    console.log("Element to revert:", el);
    var originalParentId = el.getAttribute('data-original-parent');
    console.log("Original Parent ID in revertDrag: ", originalParentId);  // Debug line
    var originalParent = document.getElementById(originalParentId);

    let currentSessionIndex = parseInt(el.closest('.session').id.replace('session', ''));
    let totalSessions = document.querySelectorAll('.session').length;
    let subjectsToBeRemoved = [];

    for (let i = currentSessionIndex + 1; i < totalSessions; i++) {
        let sessionElement = document.getElementById('session' + i);
        if (sessionElement) {
            let subjectsInSession = Array.from(sessionElement.getElementsByClassName('subject'));

            let mainSubjectElement = subjectsInSession.find(subjectElement => {
                let prerequisitesString = subjectElement.getAttribute('data-prerequisites') || '[]';
                let prerequisitesArray = JSON.parse(prerequisitesString);
                return prerequisitesArray.includes(el.id);
            });

            if (mainSubjectElement) subjectsToBeRemoved.push(mainSubjectElement);
        }
    }

    if (subjectsToBeRemoved.length > 0) {
        let subjectNames = subjectsToBeRemoved.map(subject => subject.id).join(", ");
        Swal.fire({
            title: 'Are you sure?',
            text: `Removing this subject will also remove ${subjectNames} from the planner as they have this subject as a prerequisite. Do you want to proceed?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, remove both!'
        }).then((result) => {
            if (result.isConfirmed) {
                subjectsToBeRemoved.forEach(subject => subject.querySelector('.reset-btn').click());
                if (originalParent) {
                    originalParent.appendChild(el);
                    var resetBtn = el.querySelector('.reset-btn');
                    if (resetBtn) el.removeChild(resetBtn);
                } else {
                    console.error('Original parent not found');
                }
                decrementCredits(el);
            }
        });

    } else {
        decrementCredits(el);
        if (originalParent) {
            originalParent.appendChild(el);
            var resetBtn = el.querySelector('.reset-btn');
            if (resetBtn) el.removeChild(resetBtn);
        } else {
            console.error('Original parent not found');
        }
    }
}

function setupSubjectElement(subjectDiv, sessionIndex) {
    if (!subjectDiv.hasAttribute('data-original-parent')) {
        subjectDiv.setAttribute('data-original-parent', subjectDiv.parentElement.id);
    }
    if (prerequisitesMet(subjectDiv, sessionIndex)) {
        console.log(`Prerequisites met for ${subjectDiv.id}`);
        if (!subjectDiv.querySelector('.reset-btn')) {
            var resetBtn = document.createElement('span');
            resetBtn.innerHTML = " X";
            resetBtn.className = 'reset-btn';
            resetBtn.style.color = "red";
            resetBtn.style.cursor = "pointer";

            resetBtn.addEventListener('click', function () {
                revertDrag(subjectDiv);
               // decrementCredits(subjectDiv);
            });

            subjectDiv.appendChild(resetBtn);
        }
    } else {
        console.log(`Prerequisites NOT met for ${subjectDiv.id}`);
        Swal.fire({
            icon: 'warning',
            title: 'Oops...',
            text: `Prerequisites not met for ${subjectDiv.id}! Make sure you have prerequisites placed in a previous semester`,
        });
        decrementCredits(subjectDiv);
    }
}

// Add this function to perform the prerequisite checks
function prerequisitesMet(el, targetSessionIndex) {
    console.log("Checking prerequisites for ", el.id, "in session", targetSessionIndex);
    let prerequisitesString = el.getAttribute('data-prerequisites') || '[]';
    let prerequisitesArray = JSON.parse(prerequisitesString);
    let prerequisiteType = el.getAttribute('data-prerequisite-type') || '';
    console.log("Prerequisites Array: ", prerequisitesArray);
    console.log("Prerequisite Type: ", prerequisiteType);
    let prerequisitesMet = false;

    if (prerequisiteType === 'AND') {
        prerequisitesMet = prerequisitesArray.every(prerequisite => {
            let found = false;
            for (let i = 0; i < targetSessionIndex; i++) {
                let sessionElement = document.getElementById('session' + i);
                if (sessionElement) {
                    let subjectsInSession = Array.from(sessionElement.getElementsByClassName('subject'));
                    found = subjectsInSession.some(subjectElement => subjectElement.id === prerequisite);
                    if (found) break;
                }
            }
            return found;
        });
    } else if (prerequisiteType === 'OR') {
        prerequisitesMet = prerequisitesArray.some(prerequisite => {
            let found = false;
            for (let i = 0; i < targetSessionIndex; i++) {
                let sessionElement = document.getElementById('session' + i);
                if (sessionElement) {
                    let subjectsInSession = Array.from(sessionElement.getElementsByClassName('subject'));
                    found = subjectsInSession.some(subjectElement => subjectElement.id === prerequisite);
                    if (found) break;
                }
            }
            return found;
        });
    } else {
        prerequisitesMet = true; // If there are no prerequisites, then they are considered as met.
    }

    return prerequisitesMet;
}

document.addEventListener('DOMContentLoaded', function () {
    let dashboardContainer = document.querySelector('.dashboard-container');
    let resetSubjectUrl = dashboardContainer.getAttribute('data-reset-subject-url');
    let startingSession = dashboardContainer.getAttribute('data-starting-session'); // Get the starting session


    // Initialize accumulated credits
    const accumulatedCreditsElement = document.getElementById("accumulated-credits");
    if (!accumulatedCreditsElement) {
        console.error("Accumulated credits element not found!");
        return;
    }

    function updateDisplayedCredits() {
        accumulatedCreditsElement.innerText = "Credits: " + accumulatedCredits;
    }

    function incrementCreditsBy(value) {
        accumulatedCredits += value;
        updateDisplayedCredits();
    }

    function decrementCredits(el) {
        accumulatedCredits -= 6;
        updateDisplayedCredits();
    }

    var dragulaContainers = Array.from(document.querySelectorAll('.available-section, .placeholder'));


    dragula(dragulaContainers)
    .on('drag', function (el) {
        // Check if the original parent is already set
        if (!el.hasAttribute('data-original-parent')) {
            // Store the original parent to use it later in case of invalid drop
            el.setAttribute('data-original-parent', el.parentElement.id);
        }
    })
    .on('drop', function (el, target, source, sibling) {

        var isSourceAvailableSection = source.classList.contains('available-section');
        var isTargetAvailableSection = target.classList.contains('available-section');

        if (isSourceAvailableSection && !isTargetAvailableSection) {  // Checking if the source is the available section and target is the planner.
            incrementCreditsBy(6);
        }

        if (!isSourceAvailableSection && isTargetAvailableSection) {  // Checking if the source is the planner and the target is the available section.
            decrementCredits(el);  // decrement by 6
        }

        console.log("Target Element: ", target); // Log the entire target element



        // Find the closest element with the class 'session'
        let sessionElement = target.closest('.session');
        console.log("Closest Session Element: ", sessionElement); // Log the closest session element

        // If a session element is found, and it has an id, extract the index from it.
        let dependentSubjects = [];

        if (sessionElement && sessionElement.id) {
            targetSessionIndex = parseInt(sessionElement.id.replace('session', ''));

            let totalSessions = document.querySelectorAll('.session').length;
            let dependentSubjects = [];

            for (let i = 0; i < totalSessions; i++) {
                let sessionElement = document.getElementById('session' + i);
                if (sessionElement) {
                    let subjectsInSession = Array.from(sessionElement.getElementsByClassName('subject'));
                    subjectsInSession.forEach(subject => {
                        let prerequisitesString = subject.getAttribute('data-prerequisites') || '[]';
                        let prerequisitesArray = JSON.parse(prerequisitesString);
                        if (prerequisitesArray.includes(el.id)) {
                            dependentSubjects.push({ subject, sessionIndex: i });
                        }
                    });
                }
            }

            let invalidMoveFound = dependentSubjects.some(dependentSubject => dependentSubject.sessionIndex <= targetSessionIndex);

            if (invalidMoveFound) {
                // Remove dependent subjects from the planner and send them back to their original positions.
                dependentSubjects.forEach(dependentSubject => {
                    if(dependentSubject.sessionIndex <= targetSessionIndex) {
                        let resetBtn = dependentSubject.subject.querySelector('.reset-btn');
                        if(resetBtn) {
                            resetBtn.click(); // this will handle the credit decrementing too
                        }
                    }
                });

                let dependentSubjectNames = dependentSubjects.map(depSub => depSub.subject.id).join(", ");
                Swal.fire({
                    icon: 'error',
                    title: 'Prerequisite Clash ',
                    text: `This is a prerequisite for ${dependentSubjectNames} . This move will remove ${dependentSubjectNames} from the planner .`,
                });
                return;
            }
        }

        // Log Target Session Index again after the correction.
        console.log("Corrected Target Session Index: ", targetSessionIndex);
        let prerequisitesString = el.getAttribute('data-prerequisites') || '[]';
        console.log("Prerequisites String: ", prerequisitesString);
        let prerequisitesArray = JSON.parse(prerequisitesString);
        let prerequisiteType = el.getAttribute('data-prerequisite-type') || '';

        console.log("Prerequisites Array: ", prerequisitesArray);
        console.log("Prerequisite Type: ", prerequisiteType);

        // Check if both source and target are available sections, then revert.
        if(isSourceAvailableSection && isTargetAvailableSection){

            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'The given course structure cannot be changed!',
            });
            var originalParentId = el.getAttribute('data-original-parent');
            var originalParent = document.getElementById(originalParentId);
            if (originalParent) {
                originalParent.appendChild(el);
                var resetBtn = el.querySelector('.reset-btn');
                if (resetBtn) el.removeChild(resetBtn);
            } else {
                console.error('Original parent not found');
            }
            return;
        }
        var sessionRestriction = el.getAttribute('data-sessions');
        var targetSessionIndex = parseInt(target.parentElement.id.split('session')[1]);


        // Correctly determine whether the target session is Autumn or Spring
        var isAutumnSession;
        if (startingSession.toLowerCase() === 'autumn') {
            isAutumnSession = targetSessionIndex % 2 === 0;
        } else { // startingSession is 'spring'
            isAutumnSession = targetSessionIndex % 2 === 1;
        }

        var validSession = (sessionRestriction.toLowerCase() === 'both' || (isAutumnSession && sessionRestriction.toLowerCase() === 'autumn') || (!isAutumnSession && sessionRestriction.toLowerCase() === 'spring'));

        if (!validSession || (target.childElementCount > 1)) {
            var originalParentId = el.getAttribute('data-original-parent');
            var originalParent = document.getElementById(originalParentId);

            if (originalParent) {
                originalParent.appendChild(el);
                var resetBtn = el.querySelector('.reset-btn');
                if (resetBtn) el.removeChild(resetBtn);
            } else {
                console.error('Original parent not found');
            }

            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: !validSession ? 'This subject is not offered in this session. Please check the subject session.' : 'This slot already contains a subject'
            });
            decrementCredits(el);

            return;
        }

        // Log all subjects in all sessions before the target session.
        for (let i = 0; i < targetSessionIndex; i++) {
            let sessionElement = document.getElementById('session' + i);
            if (sessionElement) {
                let subjectsInSession = Array.from(sessionElement.getElementsByClassName('subject'));
                console.log(`Subjects in session ${i}:`, subjectsInSession.map(e => e.id));
            }
        }
        // Correctly determine whether the target session is Autumn or Spring and log it to the console.
        var isAutumnSession;
        if (startingSession.toLowerCase() === 'autumn') {
            isAutumnSession = targetSessionIndex % 2 === 0;
        } else { // startingSession is 'spring'
            isAutumnSession = targetSessionIndex % 2 === 1;
        }
        console.log(`Is Autumn Session: ${isAutumnSession}`);

        // Modified Prerequisite Checking Logic
        let prerequisitesMet = false;
        if (prerequisiteType === 'AND') {
            prerequisitesMet = prerequisitesArray.every(prerequisite => {
                let found = false;
                for (let i = 0; i < targetSessionIndex; i++) {
                    let sessionElement = document.getElementById('session' + i);
                    if (sessionElement) {
                        let subjectsInSession = Array.from(sessionElement.getElementsByClassName('subject'));
                        found = subjectsInSession.some(subjectElement => subjectElement.id === prerequisite);
                        if (found) break;
                    }
                }
                return found;
            });
        } else if (prerequisiteType === 'OR') {
            prerequisitesMet = prerequisitesArray.some(prerequisite => {
                let found = false;
                for (let i = 0; i < targetSessionIndex; i++) {
                    let sessionElement = document.getElementById('session' + i);
                    if (sessionElement) {
                        let subjectsInSession = Array.from(sessionElement.getElementsByClassName('subject'));
                        found = subjectsInSession.some(subjectElement => subjectElement.id === prerequisite);
                        if (found) break;
                    }
                }
                return found;
            });
        } else {
            prerequisitesMet = true; // If there are no prerequisites, then they are considered as met.
        }

        console.log("Final - Prerequisites Met: ", prerequisitesMet);

        // Rest of your logic remains the same
        if (!prerequisitesMet) {
            Swal.fire({
                icon: 'warning',
                title: 'Oops...',
                text: 'Prerequisites not met! make sure you have prerequisites placed in a previous semester',
            });
            revertDrag(el);
            decrementCredits(el);
            return;
        }

        if (!el.querySelector('.reset-btn')) {

            var resetBtn = document.createElement('span');
            resetBtn.innerHTML = " X";
            resetBtn.className = 'reset-btn';
            resetBtn.style.color = "red";
            resetBtn.style.cursor = "pointer";

            resetBtn.addEventListener('click', function () {

                var originalParentId = el.getAttribute('data-original-parent');
                var originalParent = document.getElementById(originalParentId);
                let currentSessionIndex = parseInt(el.closest('.session').id.replace('session', ''));
                let totalSessions = document.querySelectorAll('.session').length;
                let subjectsToBeRemoved = [];

                for (let i = currentSessionIndex + 1; i < totalSessions; i++) {
                    let sessionElement = document.getElementById('session' + i);
                    if (sessionElement) {
                        let subjectsInSession = Array.from(sessionElement.getElementsByClassName('subject'));

                        let mainSubjectElement = subjectsInSession.find(subjectElement => {
                            let prerequisitesString = subjectElement.getAttribute('data-prerequisites') || '[]';
                            let prerequisitesArray = JSON.parse(prerequisitesString);
                            return prerequisitesArray.includes(el.id);
                        });

                        if (mainSubjectElement) subjectsToBeRemoved.push(mainSubjectElement);
                    }
                }

                if (subjectsToBeRemoved.length > 0) {
                    let subjectNames = subjectsToBeRemoved.map(subject => subject.id).join(", ");
                    Swal.fire({
                        title: 'Are you sure?',
                        text: `Removing this subject will also remove ${subjectNames} from the planner as they have this subject as a prerequisite. Do you want to proceed?`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Yes, remove both!'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            subjectsToBeRemoved.forEach(subject => subject.querySelector('.reset-btn').click());
                            if (originalParent) {
                                originalParent.appendChild(el);
                                el.removeChild(resetBtn);
                            } else {
                                console.error('Original parent not found');
                            }
                            decrementCredits(el);
                            fetch(resetSubjectUrl, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ subject_code: el.id })
                            })
                                .then(response => response.json())
                                .then(data => {
                                    if (!data.success) {
                                        alert('Error resetting the subject: ' + data.error);
                                    }
                                })
                                .catch((error) => {
                                    console.error('Error:', error);
                                });
                            decrementCredits(el);
                        }
                    });
                } else {
                    if (originalParent) {
                        originalParent.appendChild(el);
                        el.removeChild(resetBtn);
                    } else {
                        console.error('Original parent not found');
                    }

                    fetch(resetSubjectUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ subject_code: el.id })
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (!data.success) {
                                alert('Error resetting the subject: ' + data.error);
                            }
                        })
                        .catch((error) => {
                            console.error('Error:', error);
                        });
                }
            });

            el.appendChild(resetBtn);
        }
    });
    document.querySelectorAll('.dropdown-item').forEach(function(item) {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            let subjectCode = this.textContent.split(' - ')[0].trim();
            let subjectElement = document.getElementById(subjectCode);

            if(subjectElement) {
                subjectElement.scrollIntoView({behavior: 'smooth', block: 'center'});

                // Add the blink class to start the blinking effect
                subjectElement.classList.add('blink');

                // Remove the blink class after 3 seconds to stop the blinking effect
                setTimeout(() => { subjectElement.classList.remove('blink'); }, 2000);
            }
        });
    });
});

// Existing logic for "Recommend Core Subjects" button
document.addEventListener('DOMContentLoaded', function() {
    const recommendButton = document.getElementById('recommend-btn');
    const accumulatedCreditsElement = document.getElementById("accumulated-credits");
    if (recommendButton) {
        recommendButton.addEventListener('click', function() {
            accumulatedCredits = 0;
            let dashboardContainer = document.querySelector('.dashboard-container');
            let startingSession = dashboardContainer.getAttribute('data-starting-session'); // Get the starting session
            let storedMajor = window.storedMajor || localStorage.getItem('selectedMajor');
            console.log("Stored Major: ", storedMajor);

            let coreSubjectsOrder;
            if(storedMajor == "Information Systems Development") {
                console.log("Stored Major: ", storedMajor);
                if (startingSession.toLowerCase() === 'autumn') {
                    coreSubjectsOrder = [
                        ['CSIT881', 'CSIT883'],  // First Autumn
                        ['CSIT882', 'CSIT884', 'CSIT985', 'ISIT906'],  // First Spring
                        ['CSIT988', 'ISIT950'],  // Second Autumn
                        ['CSCI927']  // Second Spring
                    ];
                } else {  // Assuming the only other option is 'spring'
                    coreSubjectsOrder = [
                        ['CSIT881', 'CSIT883', 'CSIT985'],  // First Spring
                        ['CSIT882', 'CSIT884', 'CSIT988'],  // First Autumn
                        ['ISIT906', 'CSCI927'],  // Second Autumn
                        ['ISIT950']  // Second Spring
                    ];
                }
            }
            let sessionIndex = 0;
            document.querySelectorAll('.planner-container .session').forEach(sessionDiv => {
                if (coreSubjectsOrder[sessionIndex]) {
                    let placeholderIndex = 0;
                    const placeholders = sessionDiv.querySelectorAll('.placeholder');
                    coreSubjectsOrder[sessionIndex].forEach(subjectCode => {
                        const subjectDiv = document.getElementById(subjectCode);
                        if (subjectDiv && placeholders[placeholderIndex]) {
                            setupSubjectElement(subjectDiv, sessionIndex);
                            placeholders[placeholderIndex].appendChild(subjectDiv);
                            // Run prerequisite check here
                            if (prerequisitesMet(subjectDiv, sessionIndex)) {
                                console.log(`Prerequisites met for ${subjectDiv.id}`);
                                // Store the current parent ID before moving the subject
                                if (!subjectDiv.hasAttribute('data-original-parent')) {
                                    subjectDiv.setAttribute('data-original-parent', subjectDiv.parentElement.id);
                                    console.log("Setting data-original-parent in recommendButton: ", subjectDiv.getAttribute('data-original-parent'));  // Debug line
                                }
                                // Move subject only if prerequisites are met
                                placeholders[placeholderIndex].appendChild(subjectDiv);
                                // Add the 'x' button to the moved element
                                if (!subjectDiv.querySelector('.reset-btn')) {
                                    var resetBtn = document.createElement('span');
                                    resetBtn.innerHTML = " X";
                                    resetBtn.className = 'reset-btn';
                                    resetBtn.style.color = "red";
                                    resetBtn.style.cursor = "pointer";

                                    resetBtn.addEventListener('click', function () {
                                        revertDrag(subjectDiv);
                                    });

                                    subjectDiv.appendChild(resetBtn);
                                }
                                placeholderIndex++;
                                incrementCreditsBy(6);
                            } else {
                                console.log(`Prerequisites NOT met for ${subjectDiv.id}`);
                                // Show alert if prerequisites are not met
                                Swal.fire({
                                    icon: 'warning',
                                    title: 'Oops...',
                                    text: `Prerequisites not met for ${subjectCode}! Make sure you have prerequisites placed in a previous semester`,
                                });
                                decrementCredits(el);
                            }
                        }
                    });
                }
                sessionIndex++;
            });
        });
    }
});