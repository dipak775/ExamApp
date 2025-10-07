document.addEventListener('DOMContentLoaded', () => {
    const subjectList = document.getElementById('subject-list');
    const notesContent = document.getElementById('notes-content');
    let subjectsData = [];
    let userClassLevel = '';

    // --- Initial Setup ---

    // Shows a skeleton loader in the sidebar
    function showSkeletonLoader() {
        subjectList.innerHTML = ''; // Clear existing list
        for (let i = 0; i < 5; i++) { // Create 5 skeleton items
            const skeletonItem = document.createElement('li');
            skeletonItem.className = 'skeleton';
            subjectList.appendChild(skeletonItem);
        }
    }

    // Fetches subjects and populates the sidebar
    async function initializeSubjects() {
        showSkeletonLoader(); // Show skeleton loader
        try {
            // Simulate a network delay for demonstration
            await new Promise(resolve => setTimeout(resolve, 1000));

            const authRes = await fetch('/api/check-auth');
            const authData = await authRes.json();
            if (authData.loggedIn) {
                userClassLevel = authData.user.classLevel.toString();
            }

            const response = await fetch('/api/student/subjects');
            if (!response.ok) throw new Error('Failed to load subjects.');
            subjectsData = await response.json();
            renderSubjects();
        } catch (error) {
            console.error('Initialization Error:', error);
            subjectList.innerHTML = '<li>Failed to load subjects.</li>';
        }
    }

    // Renders the subject list in the sidebar
    function renderSubjects() {
        subjectList.innerHTML = ''; // Clear existing list
        if (subjectsData.length === 0) {
            subjectList.innerHTML = '<li>No subjects approved yet. Please contact an admin.</li>';
            return;
        }

        subjectsData.forEach(subject => {
            const subjectItem = document.createElement('li');
            subjectItem.className = 'subject-item';
            subjectItem.innerHTML = `
                <div class="subject-name" data-subject="${subject.name}">
                    <span class="subject-icon">&#x1F4D8;</span> <!-- Book icon -->
                    <span>${subject.name}</span>
                </div>
                <ul class="chapter-list" data-chapters-for="${subject.name}"></ul>
            `;
            subjectList.appendChild(subjectItem);
        });
    }

    // --- Event Handling ---

    // Main event listener for clicks within the sidebar
    subjectList.addEventListener('click', (e) => {
        const subjectNameDiv = e.target.closest('.subject-name');
        const chapterItem = e.target.closest('.chapter-item');

        if (subjectNameDiv) {
            handleSubjectClick(subjectNameDiv);
        } else if (chapterItem) {
            handleChapterClick(chapterItem);
        }
    });

    // Handles expanding/collapsing a subject to show chapters
    function handleSubjectClick(subjectDiv) {
        const subjectName = subjectDiv.dataset.subject;
        const chapterList = subjectList.querySelector(`[data-chapters-for="${subjectName}"]`);
        const wasActive = subjectDiv.classList.contains('active');

        // Close all other subjects
        document.querySelectorAll('.subject-name.active').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.chapter-list').forEach(ul => ul.style.display = 'none');

        // If it wasn't already open, open it and populate chapters
        if (!wasActive) {
            subjectDiv.classList.add('active');
            chapterList.style.display = 'block';
            populateChapters(subjectName, chapterList);
        }
    }

    // Populates the chapter list for a given subject
    function populateChapters(subjectName, chapterList) {
        if (chapterList.innerHTML !== '') return; // Already populated

        const subject = subjectsData.find(s => s.name === subjectName);
        if (subject) {
            const classData = subject.classes.find(c => c.classLevel === userClassLevel);
            if (classData && classData.chapters && classData.chapters.length > 0) {
                chapterList.innerHTML = classData.chapters.map((chapter, index) => 
                    `<li class="chapter-item" data-subject="${subjectName}" data-chapter="${chapter}">${index + 1}. ${chapter}</li>`
                ).join('');
            } else {
                chapterList.innerHTML = '<li>No chapters found.</li>';
            }
        } else {
            chapterList.innerHTML = '<li>No chapters found.</li>';
        }
    }

    // Handles loading questions when a chapter is clicked
    function handleChapterClick(chapterLi) {
        const { subject, chapter } = chapterLi.dataset;

        // Highlight active chapter
        document.querySelectorAll('.chapter-item.active').forEach(el => el.classList.remove('active'));
        chapterLi.classList.add('active');

        loadNotes(subject, chapter);

        // --- Mobile-specific behavior ---
        // If in mobile view (e.g., screen width is less than 768px),
        // collapse the chapter list after a selection has been made.
        if (window.innerWidth < 768) {
            const subjectNameDiv = subjectList.querySelector(`.subject-name[data-subject="${subject}"]`);
            const chapterList = subjectList.querySelector(`[data-chapters-for="${subject}"]`);

            if (subjectNameDiv && chapterList) {
                subjectNameDiv.classList.remove('active');
                chapterList.style.display = 'none';
            }
        }
    }

    // --- Data Fetching & Rendering for Main Content ---

    // Fetches and displays notes for the selected chapter
    async function loadNotes(subjectName, chapterName) {
        showLoadingState();
        try {
            const url = `/api/student/notes?subjectName=${encodeURIComponent(subjectName)}&chapterName=${encodeURIComponent(chapterName)}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to load notes.');
            const notes = await response.json();
            renderNotes(notes);
        } catch (error) {
            console.error('Error loading notes:', error);
            notesContent.innerHTML = '<p>Error loading notes. Please try again.</p>';
        }
    }

    // Renders the questions and answers in the main content area
    function renderNotes(notes, searchTerm = null) {
        if (!notes || notes.length === 0) {
            notesContent.innerHTML = searchTerm 
                ? '<p>No questions found matching your search.</p>' 
                : '<p>No questions found for this chapter.</p>';
            return;
        }

        const highlight = (text, term) => {
            if (!term) return text;
            const regex = new RegExp(`(${term})`, 'gi');
            return text.replace(regex, '<mark>$1</mark>');
        };

        notesContent.innerHTML = notes.map((note, index) => {
            const delimiter = '|||';
            const delimiterIndex = note.content.indexOf(delimiter);
            let question, answer;

            if (delimiterIndex !== -1) {
                question = note.content.substring(0, delimiterIndex).trim();
                answer = note.content.substring(delimiterIndex + delimiter.length).trim();
            } else {
                question = note.content.trim();
                answer = 'No answer provided.';
            }
            
            if (searchTerm) {
                question = highlight(question, searchTerm);
                answer = highlight(answer, searchTerm);
            }

            // Build the chapter info string only if it's a search result
            const chapterInfo = searchTerm ? `<div class="note-chapter-info">Chapter: ${note.chapter}</div>` : '';

            return `
                <div class="qa-item">
                    ${chapterInfo}
                    <div class="qa-question" data-index="${index}">
                        <pre>${index + 1}. ${question}</pre>
                    </div>
                    <div class="qa-answer" id="answer-${index}">
                        <pre>${answer || 'No answer provided.'}</pre>
                    </div>
                </div>
            `;
        }).join('');
    }

    // --- Accordion Logic for Main Content ---

    // Handles the accordion functionality for Q&A items
    notesContent.addEventListener('click', (e) => {
        const questionDiv = e.target.closest('.qa-question');
        if (questionDiv) {
            const index = questionDiv.dataset.index;
            const answerDiv = document.getElementById(`answer-${index}`);
            const wasActive = questionDiv.classList.contains('active');

            // Close all currently active items
            document.querySelectorAll('.qa-question.active').forEach(q => {
                q.classList.remove('active');
            });
            document.querySelectorAll('.qa-answer').forEach(a => {
                if (a.id !== `answer-${index}`) {
                    a.style.maxHeight = null;
                    a.style.padding = null;
                }
            });

            // Toggle the clicked item
            if (!wasActive) {
                questionDiv.classList.add('active');
                answerDiv.style.padding = '0 20px'; // Prepare for padding transition
                // Set max-height after a short delay to allow transition to work
                setTimeout(() => {
                    answerDiv.style.maxHeight = answerDiv.scrollHeight + 20 + 'px';
                    answerDiv.style.padding = '10px 20px';
                }, 10);
            } else {
                 answerDiv.style.maxHeight = null;
                 answerDiv.style.padding = '0 20px';
            }
        }
    });
    
    function showLoadingState() {
        notesContent.innerHTML = '<p>Loading questions...</p>';
    }

    // --- Initial Load ---
    function showInitialPlaceholder() {
        notesContent.innerHTML = `
            <div class="content-placeholder">
                <div class="content-placeholder-icon">&#x1F4DA;</div>
                <h2>Welcome to the Notes Section</h2>
                <p>Select a subject and chapter from the sidebar to view questions.</p>
            </div>
        `;
    }

    showInitialPlaceholder();
    initializeSubjects();

    const searchButton = document.getElementById('search-button');
    const searchBox = document.getElementById('search-box');

    searchButton.addEventListener('click', performSearch);
    searchBox.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    async function performSearch() {
        const searchTerm = searchBox.value.trim().toLowerCase();
        const activeSubject = document.querySelector('.subject-name.active');

        if (!activeSubject) {
            alert('Please select a subject first.');
            return;
        }

        if (!searchTerm) {
            alert('Please enter a search term.');
            return;
        }

        const subjectName = activeSubject.dataset.subject;
        showLoadingState();

        try {
            // Fetch all notes for the subject, not just a chapter
            const url = `/api/student/notes?subjectName=${encodeURIComponent(subjectName)}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to load notes for search.');
            const notes = await response.json();

            const rankedResults = notes.map(note => {
                const delimiter = '|||';
                const delimiterIndex = note.content.indexOf(delimiter);
                let question, answer;

                if (delimiterIndex !== -1) {
                    question = note.content.substring(0, delimiterIndex).trim().toLowerCase();
                    answer = note.content.substring(delimiterIndex + delimiter.length).trim().toLowerCase();
                } else {
                    question = note.content.trim().toLowerCase();
                    answer = ''; // No answer content to search
                }
                let score = 0;

                if (question.includes(searchTerm)) {
                    score += 2; // Higher score for question match
                }
                if (answer.includes(searchTerm)) {
                    score += 1; // Lower score for answer match
                }

                return { ...note, score };
            }).filter(note => note.score > 0) // Filter out notes with no match
              .sort((a, b) => b.score - a.score); // Sort by score descending

            renderNotes(rankedResults, searchTerm);

        } catch (error) {
            console.error('Error during search:', error);
            notesContent.innerHTML = '<p>Error performing search. Please try again.</p>';
        }
    }
});
