// main.js - Logic for Lá Vem História Interface

// Security check: must be logged in to view this page
if (localStorage.getItem('lavemhistoriaToken') !== 'true') {
    window.location.href = 'login.html';
}

document.addEventListener("DOMContentLoaded", () => {
    // Question item selection logic
    const questionItems = document.querySelectorAll('.question-item');
    const mainQuestionTitle = document.querySelector('.main-question');
    const textContentArea = document.querySelector('.text-content');
    
    // Store answers in memory
    const questionAnswers = {};
    const questionImages = {};
    const questionAudios = {};
    window.currentActiveIndex = undefined;
    
    // Helper to control upload button state
    function updateUploadButtonState(index) {
        const btnUploadImage = document.getElementById('btnUploadImage');
        if (btnUploadImage) {
            const count = questionImages[index] ? questionImages[index].length : 0;
            btnUploadImage.disabled = count >= 2;
        }
        
        const btnUploadAudio = document.getElementById('btnUploadAudio');
        if (btnUploadAudio) {
            const hasAudio = !!questionAudios[index];
            btnUploadAudio.disabled = hasAudio;
        }
    }

    // Helper to render thumbnails
    function renderThumbnails(index) {
        const thumbsContainer = document.getElementById('dynamicThumbnails');
        if (!thumbsContainer) return;
        thumbsContainer.innerHTML = '';
        const imgs = questionImages[index] || [];
        imgs.forEach((dataUrl, i) => {
            const rot = i % 2 === 0 ? 4 : -9;
            const ml = i > 0 ? '-20px' : '0';
            const z = 10 - i;
            thumbsContainer.innerHTML += `
                <div class="thumbnail" onclick="window.openImageModal(${i})" style="transform: rotate(${rot}deg); margin-left: ${ml}; z-index: ${z}; border: 3px solid white; box-shadow: 0px 50px 30px 0px rgba(0,0,0,0.05), 0px 22px 22px 0px rgba(0,0,0,0.09); cursor: pointer;">
                    <img src="${dataUrl}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
            `;
        });
        
        const audioUrl = questionAudios[index];
        if (audioUrl) {
            const ml = imgs.length > 0 ? '16px' : '0';
            thumbsContainer.innerHTML += `
                <div class="thumbnail audio-thumbnail" onclick="window.openAudioPlaybackModal()" style="margin-left: ${ml}; z-index: 10; cursor: pointer; display: flex; align-items: center; justify-content: center; background-color: #99e2b4; border: none; box-shadow: 0px 50px 30px 0px rgba(0,0,0,0.05), 0px 22px 22px 0px rgba(0,0,0,0.09);">
                    <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #263435; display: flex; align-items: center; justify-content: center;">
                        <svg fill="white" viewBox="0 0 12 12" width="12" height="12">
                            <rect x="2" y="4" width="1.5" height="4" rx="0.5"></rect>
                            <rect x="4.5" y="2" width="1.5" height="8" rx="0.5"></rect>
                            <rect x="7" y="3" width="1.5" height="6" rx="0.5"></rect>
                            <rect x="9.5" y="4.5" width="1.5" height="3" rx="0.5"></rect>
                        </svg>
                    </div>
                </div>
            `;
        }
    }

    window.openAudioPlaybackModal = function() {
        const idx = window.currentActiveIndex;
        if (idx !== undefined && questionAudios[idx]) {
            const player = document.getElementById('audioPlaybackPlayer');
            const modal = document.getElementById('audioPlaybackModal');
            if (player) player.src = questionAudios[idx];
            if (modal) modal.classList.add('active');
        }
    };

    // Find initial active index
    questionItems.forEach((item, index) => {
        if (item.classList.contains('active')) {
            window.currentActiveIndex = index;
            updateUploadButtonState(index);
            const parentChapter = item.closest('.chapter');
            if (parentChapter) parentChapter.classList.add('open');
        }
    });

    // Chapter Accordion Logic
    const chapterHeaders = document.querySelectorAll('.chapter-header');
    chapterHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const parentChapter = header.closest('.chapter');
            const wasOpen = parentChapter.classList.contains('open');
            document.querySelectorAll('.chapter').forEach(c => c.classList.remove('open'));
            if (!wasOpen) {
                parentChapter.classList.add('open');
            }
        });
    });
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

            // Ensure parent chapter is open
            const parentChapter = this.closest('.chapter');
            if (parentChapter && !parentChapter.classList.contains('open')) {
                document.querySelectorAll('.chapter').forEach(c => c.classList.remove('open'));
                parentChapter.classList.add('open');
            }
            
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
                    <div id="dynamicAudio" class="dynamic-audio-container"></div>
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
                    updateProgressBar();
                });
                
                // Track currently active index to attach images to it
                window.currentActiveIndex = index;
                updateUploadButtonState(index);
                
                const btnPrevQuestion = document.getElementById('btnPrevQuestion');
                const btnNextQuestion = document.getElementById('btnNextQuestion');
                if (btnPrevQuestion) {
                    btnPrevQuestion.style.opacity = index === 0 ? '0.3' : '1';
                    btnPrevQuestion.style.cursor = index === 0 ? 'not-allowed' : 'pointer';
                }
                if (btnNextQuestion) {
                    btnNextQuestion.style.opacity = index === questionItems.length - 1 ? '0.3' : '1';
                    btnNextQuestion.style.cursor = index === questionItems.length - 1 ? 'not-allowed' : 'pointer';
                }

                // Render any existing media for this question
                renderThumbnails(index);
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
    const actionBtns = document.querySelectorAll('.action-btn:not(#btnUploadImage)');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const originalText = this.querySelector('span').innerText;
            this.querySelector('span').innerText = 'Aberto...';
            setTimeout(() => {
                this.querySelector('span').innerText = originalText;
            }, 1000);
        });
    });

    // Image & Audio Upload Logic
    const imageUploadInput = document.getElementById('imageUploadInput');
    const btnUploadImage = document.getElementById('btnUploadImage');
    const btnUploadAudio = document.getElementById('btnUploadAudio');
    
    if (btnUploadImage && imageUploadInput) {
        btnUploadImage.addEventListener('click', () => {
            // Only trigger if a question is actively selected
            if (window.currentActiveIndex !== undefined) {
                imageUploadInput.click();
            }
        });
        
        imageUploadInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;
            
            const idx = window.currentActiveIndex;
            if (!questionImages[idx]) questionImages[idx] = [];
            
            const count = questionImages[idx].length;
            const remaining = 2 - count;
            if (remaining <= 0) return;
            
            const allowedFiles = files.slice(0, remaining);
            
            allowedFiles.forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const dataUrl = event.target.result;
                    questionImages[idx].push(dataUrl);
                    
                    renderThumbnails(idx);
                    updateUploadButtonState(idx);
                };
                reader.readAsDataURL(file);
            });
            // Reset input so same file can be uploaded again if needed
            e.target.value = '';
        });
    }

    // Audio Recorder Logic
    const audioRecordModal = document.getElementById('audioRecordModal');
    const btnRecordStart = document.getElementById('btnRecordStart');
    const btnRecordStop = document.getElementById('btnRecordStop');
    const btnRecordCancel = document.getElementById('btnRecordCancel');
    const btnRecordDiscard = document.getElementById('btnRecordDiscard');
    const btnRecordSave = document.getElementById('btnRecordSave');
    const recordPulse = document.getElementById('recordPulse');
    const recordTimer = document.getElementById('recordTimer');
    const recordStatusText = document.getElementById('recordStatusText');
    const audioPreviewContainer = document.getElementById('audioPreviewContainer');
    const audioModalPlayer = document.getElementById('audioModalPlayer');
    
    let mediaRecorder = null;
    let audioChunks = [];
    let recordInterval = null;
    let recordSeconds = 10;
    let finalAudioBlob = null;
    let audioStream = null;

    function resetRecorderUI() {
        recordSeconds = 10;
        recordTimer.innerText = "10s";
        recordPulse.className = 'pulse-circle';
        recordStatusText.innerText = "Pronto para gravar?";
        audioPreviewContainer.style.display = 'none';
        
        btnRecordStart.style.display = 'flex';
        if (btnRecordStop) btnRecordStop.style.display = 'none';
        btnRecordCancel.style.display = 'flex';
        btnRecordDiscard.style.display = 'none';
        btnRecordSave.style.display = 'none';
        
        finalAudioBlob = null;
        if(audioModalPlayer) audioModalPlayer.src = "";
    }

    if (btnUploadAudio && audioRecordModal) {
        btnUploadAudio.addEventListener('click', () => {
            if (window.currentActiveIndex !== undefined) {
                resetRecorderUI();
                audioRecordModal.classList.add('active');
            }
        });

        // Event for Start Recording
        btnRecordStart.addEventListener('click', () => {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    audioStream = stream;
                    audioChunks = [];
                    mediaRecorder = new MediaRecorder(stream);
                    
                    mediaRecorder.ondataavailable = e => {
                        if (e.data.size > 0) audioChunks.push(e.data);
                    };
                    
                    mediaRecorder.onstop = () => {
                        finalAudioBlob = new Blob(audioChunks, { type: 'audio/webm' }); 
                        
                        const audioUrl = URL.createObjectURL(finalAudioBlob);
                        audioModalPlayer.src = audioUrl;
                        
                        audioPreviewContainer.style.display = 'block';
                        recordPulse.classList.remove('recording');
                        recordStatusText.innerText = "Áudio gravado. Selecione a ação abaixo.";
                        btnRecordStart.style.display = 'none';
                        if (btnRecordStop) btnRecordStop.style.display = 'none';
                        btnRecordCancel.style.display = 'none';
                        btnRecordDiscard.style.display = 'flex';
                        btnRecordSave.style.display = 'flex';
                        
                        if (audioStream) {
                            audioStream.getTracks().forEach(track => track.stop());
                            audioStream = null;
                        }
                    };
                    
                    btnRecordStart.style.display = 'none';
                    if (btnRecordStop) btnRecordStop.style.display = 'flex';
                    btnRecordCancel.style.display = 'none';
                    recordPulse.classList.add('recording');
                    recordStatusText.innerText = "Gravando...";
                    
                    mediaRecorder.start();
                    
                    recordSeconds = 10;
                    recordTimer.innerText = recordSeconds + "s";
                    
                    recordInterval = setInterval(() => {
                        recordSeconds--;
                        recordTimer.innerText = recordSeconds + "s";
                        if (recordSeconds <= 0) {
                            clearInterval(recordInterval);
                            if (mediaRecorder.state === 'recording') {
                                mediaRecorder.stop();
                            }
                        }
                    }, 1000);
                })
                .catch(err => {
                    alert("Não foi possível acessar o microfone.");
                    console.error(err);
                });
        });

        btnRecordDiscard.addEventListener('click', () => {
            resetRecorderUI();
        });

        btnRecordCancel.addEventListener('click', () => {
            if(mediaRecorder && mediaRecorder.state === 'recording') {
                clearInterval(recordInterval);
                mediaRecorder.stop();
            }
            if (audioStream) {
                audioStream.getTracks().forEach(track => track.stop());
                audioStream = null;
            }
            audioRecordModal.classList.remove('active');
        });

        if (btnRecordStop) {
            btnRecordStop.addEventListener('click', () => {
                if (mediaRecorder && mediaRecorder.state === 'recording') {
                    clearInterval(recordInterval);
                    mediaRecorder.stop();
                }
            });
        }

        btnRecordSave.addEventListener('click', () => {
            if (finalAudioBlob) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const dataUrl = event.target.result;
                    const idx = window.currentActiveIndex;
                    if (idx !== undefined) {
                        questionAudios[idx] = dataUrl;
                        renderThumbnails(idx);
                        updateUploadButtonState(idx);
                    }
                    audioRecordModal.classList.remove('active');
                };
                reader.readAsDataURL(finalAudioBlob);
            }
        });
    }

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

    // Progress Bar Logic
    function updateProgressBar() {
        const totalQuestions = document.querySelectorAll('.question-item').length;
        const answeredQuestions = document.querySelectorAll('.question-item[data-status="completed"]').length;
        
        let percentage = 0;
        if (totalQuestions > 0) {
            percentage = Math.round((answeredQuestions / totalQuestions) * 100);
        }
        
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        if (progressFill) {
            progressFill.style.width = percentage + '%';
        }
        
        if (progressText) {
            progressText.innerText = percentage + '% respondido';
        }
    }
    
    // Initialize progress bar on load
    updateProgressBar();

    // Image Modal Logic
    const imageModal = document.getElementById('imageModal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnDeleteImage = document.getElementById('btnDeleteImage');
    window.modalImageContext = { idx: -1, offset: -1 };

    window.openImageModal = function(offset) {
        const idx = window.currentActiveIndex;
        if (idx !== undefined && questionImages[idx] && questionImages[idx][offset]) {
            const modalImg = document.getElementById('imageModalImg');
            const modal = document.getElementById('imageModal');
            if (modalImg) modalImg.src = questionImages[idx][offset];
            window.modalImageContext = { idx, offset };
            if (modal) modal.classList.add('active');
        }
    };

    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', () => {
            if (imageModal) imageModal.classList.remove('active');
        });
    }

    if (btnDeleteImage) {
        btnDeleteImage.addEventListener('click', () => {
            if (confirm("Tem certeza que deseja excluir esta imagem?")) {
                const { idx, offset } = window.modalImageContext;
                if (idx !== -1 && offset !== -1) {
                    questionImages[idx].splice(offset, 1);
                    renderThumbnails(idx);
                    updateUploadButtonState(idx);
                    const modal = document.getElementById('imageModal');
                    if (modal) modal.classList.remove('active');
                }
            }
        });
    }

    // Audio Playback Modal Logic
    const audioPlaybackModal = document.getElementById('audioPlaybackModal');
    const btnCloseAudioPlayback = document.getElementById('btnCloseAudioPlayback');
    const btnDeleteAudioPlayback = document.getElementById('btnDeleteAudioPlayback');
    const audioPlaybackPlayer = document.getElementById('audioPlaybackPlayer');

    if (btnCloseAudioPlayback) {
        btnCloseAudioPlayback.addEventListener('click', () => {
            if (audioPlaybackPlayer) audioPlaybackPlayer.pause();
            if (audioPlaybackModal) audioPlaybackModal.classList.remove('active');
        });
    }

    if (btnDeleteAudioPlayback) {
        btnDeleteAudioPlayback.addEventListener('click', () => {
            if (confirm("Tem certeza que deseja excluir esta gravação?")) {
                const idx = window.currentActiveIndex;
                if (idx !== undefined) {
                    delete questionAudios[idx];
                    renderThumbnails(idx);
                    updateUploadButtonState(idx);
                    if (audioPlaybackPlayer) {
                        audioPlaybackPlayer.pause();
                    }
                    if (audioPlaybackModal) audioPlaybackModal.classList.remove('active');
                }
            }
        });
    }

    // Dictation (Speech to Text) Logic
    const btnDictate = document.getElementById('btnDictate');
    let speechRecognition = null;
    let isDictating = false;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        speechRecognition = new SpeechRecognition();
        speechRecognition.continuous = true;
        speechRecognition.interimResults = true;
        speechRecognition.lang = 'pt-BR';

        speechRecognition.onstart = function() {
            isDictating = true;
            if (btnDictate) {
                btnDictate.classList.add('dictating');
            }
        };

        speechRecognition.onresult = function(event) {
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }

            const currentTextarea = document.querySelector('.answer-input');
            if (currentTextarea && finalTranscript) {
                const currentVal = currentTextarea.value;
                const separator = (currentVal.length > 0 && !currentVal.endsWith(' ') && !currentVal.endsWith('\n')) ? ' ' : '';
                currentTextarea.value = currentVal + separator + finalTranscript;
                // trigger input event to update answers object and status
                currentTextarea.dispatchEvent(new Event('input'));
            }
        };

        speechRecognition.onerror = function(event) {
            console.error("Speech recognition error:", event.error);
            if (event.error === 'not-allowed') {
                alert('Permissão para usar o microfone negada ou você não está em um site seguro (HTTPS). Para o ditado funcionar você precisa permitir.');
            } else if (event.error === 'no-speech') {
                // Ignore silent intervals
            } else {
                alert('Ocorreu um erro no reconhecimento de fala: ' + event.error);
            }
            stopDictation();
        };

        speechRecognition.onend = function() {
            if (isDictating) {
                // Keep it running if we didn't stop it intentionally
                try { speechRecognition.start(); } catch(e) { stopDictation(); }
            } else {
                stopDictation();
            }
        };
    }

    function stopDictation() {
        isDictating = false;
        if (speechRecognition) {
            try { speechRecognition.stop(); } catch(e) {}
        }
        if (btnDictate) {
            btnDictate.classList.remove('dictating');
        }
    }

    if (btnDictate && speechRecognition) {
        btnDictate.addEventListener('click', () => {
            if (isDictating) {
                stopDictation();
            } else {
                try {
                    speechRecognition.start();
                } catch(e) {
                    console.error("Could not start speech recognition:", e);
                    alert("Erro ao iniciar: " + e.message);
                }
            }
        });
    } else if (btnDictate) {
        // Browser doesn't support it
        btnDictate.addEventListener('click', () => {
            alert('A transcrição de voz não é suportada por este navegador.');
        });
    }

    // Form navigation logic
    const btnPrevQuestion = document.getElementById('btnPrevQuestion');
    const btnNextQuestion = document.getElementById('btnNextQuestion');

    if (btnPrevQuestion) {
        btnPrevQuestion.addEventListener('click', () => {
            const idx = window.currentActiveIndex;
            if (idx !== undefined && idx > 0) {
                questionItems[idx - 1].click();
            }
        });
    }

    if (btnNextQuestion) {
        btnNextQuestion.addEventListener('click', () => {
            const idx = window.currentActiveIndex;
            if (idx !== undefined && idx < questionItems.length - 1) {
                questionItems[idx + 1].click();
            }
        });
    }

    // Logout logic
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm("Deseja realmente sair da sua conta?")) {
                localStorage.removeItem('lavemhistoriaToken');
                window.location.href = 'login.html';
            }
        });
    }
});
