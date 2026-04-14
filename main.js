// main.js - Logic for Lá Vem História Interface
document.addEventListener("DOMContentLoaded", () => {
    // Question item selection logic
    const questionItems = document.querySelectorAll('.question-item');
    const mainQuestionTitle = document.querySelector('.main-question');
    const textContentArea = document.querySelector('.text-content');
    
    // Store answers in memory
    const questionAnswers = {};
    
    questionItems.forEach((item, index) => {
        item.addEventListener('click', function() {
            // Revert all items to their default state based on data-status
            questionItems.forEach(q => {
                q.classList.remove('active', 'completed', 'upcoming');
                const status = q.getAttribute('data-status');
                if (status === 'completed') {
                    q.classList.add('completed');
                    const i = q.querySelector('i');
                    if (i) i.className = 'fa-solid fa-check';
                } else {
                    q.classList.add('upcoming');
                    const i = q.querySelector('i');
                    if (i) i.className = 'fa-regular fa-circle';
                }
            });

            // Set this item as active
            this.classList.remove('completed', 'upcoming');
            this.classList.add('active');
            
            // Change icon to pencil for the active item
            const icon = this.querySelector('i');
            if(icon) {
                icon.className = 'fa-solid fa-pencil';
            }
            
            // Fetch the title from the clicked item
            const questionSpan = this.querySelector('span');
            if (questionSpan && mainQuestionTitle && textContentArea) {
                mainQuestionTitle.innerText = questionSpan.innerText;
                
                // Replace content with textarea
                textContentArea.innerHTML = `
                    <textarea class="answer-input" placeholder="Escreva aqui ou clique no microfone para começar a ditar a sua resposta..."></textarea>
                `;
                
                // Bind saving logic
                const textarea = textContentArea.querySelector('.answer-input');
                textarea.value = questionAnswers[index] || '';
                
                textarea.addEventListener('input', (e) => {
                    const text = e.target.value;
                    questionAnswers[index] = text;
                    
                    // Update the status on the fly
                    if (text.trim().length > 3) {
                        item.setAttribute('data-status', 'completed');
                    } else {
                        item.setAttribute('data-status', 'upcoming');
                    }
                });
            }
            
            // Automatically close mobile sidebar if open
            if (window.innerWidth <= 768) {
                const mobileBtn = document.getElementById('mobileMenuBtn');
                if (mobileBtn && document.querySelector('.floating-menu.open')) {
                    mobileBtn.click();
                }
            }
        });
    });

    // Simple interaction for media buttons
    const actionBtns = document.querySelectorAll('.action-btn');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const originalText = this.querySelector('span').innerText;
            this.querySelector('span').innerText = 'Aberto...';
            setTimeout(() => {
                this.querySelector('span').innerText = originalText;
            }, 1000);
        });
    });

    // Mobile Menu Toggle Logic
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const floatingMenu = document.querySelector('.floating-menu');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');

    if (mobileBtn && floatingMenu && sidebarBackdrop) {
        function toggleMobileMenu() {
            floatingMenu.classList.toggle('open');
            sidebarBackdrop.classList.toggle('active');
            // Toggle body scroll
            document.body.style.overflow = floatingMenu.classList.contains('open') ? 'hidden' : '';
        }

        mobileBtn.addEventListener('click', toggleMobileMenu);
        sidebarBackdrop.addEventListener('click', toggleMobileMenu);
    }

    // Search/Filter Logic
    const searchNavToggle = document.getElementById('searchNavToggle');
    const searchInput = document.getElementById('searchInput');

    if (searchNavToggle && searchInput) {
        searchNavToggle.addEventListener('click', () => {
            searchInput.classList.toggle('active');
            if (searchInput.classList.contains('active')) {
                searchInput.focus();
            } else {
                // Clear search if closing
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input'));
            }
        });

        // Prevent click inside input from closing it
        searchInput.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            questionItems.forEach((item, index) => {
                const questionText = item.querySelector('span').innerText.toLowerCase();
                const answerText = (questionAnswers[index] || '').toLowerCase();
                if (questionText.includes(query) || answerText.includes(query)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
});
