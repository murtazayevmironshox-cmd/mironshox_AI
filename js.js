// NexusAI Interaction Logic

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menuBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    
    const settingsPanel = document.getElementById('settingsPanel');
    const settingsToggleBtn = document.getElementById('settingsToggleBtn');
    const closePanelBtn = document.getElementById('closePanelBtn');
    
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = themeToggleBtn.querySelector('i');
    
    const tempSlider = document.getElementById('tempSlider');
    const tempValue = document.getElementById('tempValue');
    
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const messagesContainer = document.getElementById('messagesContainer');
    const welcomeScreen = document.getElementById('welcomeScreen');
    
    const attachBtn = document.getElementById('attachBtn');
    const attachmentPreview = document.getElementById('attachmentPreview');
    const removeAttachBtn = document.getElementById('removeAttachBtn');
    
    const newChatBtn = document.getElementById('newChatBtn');
    const historyList = document.getElementById('historyList');
    
    const personaOptions = document.querySelectorAll('.persona-option');
    const headerPersonaAvatar = document.getElementById('headerPersonaAvatar');
    const headerPersonaName = document.getElementById('headerPersonaName');
    const headerPersonaStatus = document.getElementById('headerPersonaStatus');
    const systemPrompt = document.getElementById('systemPrompt');
    
    const resetSettingsBtn = document.getElementById('resetSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const micBtn = document.getElementById('micBtn');
    const apiKeyInput = document.getElementById('apiKeyInput');

    // Load API key from localStorage or default
    const savedKey = localStorage.getItem('groq_api_key');
    if (savedKey) {
        apiKeyInput.value = savedKey;
    }

    // App State
    let currentTheme = 'dark';
    let activePersona = 'assistant';
    let isAttached = false;
    let chatSessions = [
        { id: 1, title: 'Boshlang\'ich suhbat', active: true, messages: [] }
    ];
    let activeChatId = 1;

    // Persona Configurations
    const personas = {
        assistant: {
            name: 'General Assistant',
            status: 'Sizning universal yordamchingiz',
            avatar: '<i class="fa-solid fa-robot"></i>',
            prompt: 'Siz aqlli, muloyim va foydali sun\'iy intellekt yordamchisiz. Foydalanuvchiga har qanday mavzuda to\'g\'ri va aniq ma\'lumot bering.',
            greetings: 'Salom! Men sizning shaxsiy yordamchingizman. Bugun sizga qanday yordam bera olaman?'
        },
        coder: {
            name: 'Code Master',
            status: 'Dasturlash va refaktoring',
            avatar: '<i class="fa-solid fa-code"></i>',
            prompt: 'Siz yuqori malakali dasturchisiz. Faqat dasturlash, algoritm va kod yozish bilan bog\'liq savollarga batafsil, toza kod va tushuntirishlar bilan javob berasiz.',
            greetings: 'Salom, dasturchi do\'stim! Qaysi tilda kod yozamiz yoki qanday algoritmik muammoni hal qilamiz?'
        },
        manga: {
            name: 'Manga Creative',
            status: 'Manga va art g\'oyalari',
            avatar: '<div class="avatar-img-wrapper"><img src="./assets/hero.png" alt="Manga Artist" class="avatar-img"></div>',
            prompt: 'Siz professional manga yozuvchisi va illyustratorisiz. Foydalanuvchiga kreativ qahramonlar, syujetlar va vizual chizmalar yaratishda yordam berasiz.',
            greetings: 'Salom! Men ijodiy manga yordamchisiman. Rooftop Sunset rasmimiz ajoyib chiqdi. Yana qanday qahramonlar yoki sahnalar yaratamiz?'
        },
        zen: {
            name: 'Zen Coach',
            status: 'Psixologik ko\'mak va tinchlik',
            avatar: '<i class="fa-solid fa-seedling"></i>',
            prompt: 'Siz xotirjam va dono meditatsiya ustozi hamda psixologsiz. Foydalanuvchilarga stressdan xalos bo\'lish, xotirjamlik va ichki tinchlikni topish bo\'yicha maslahatlar berasiz.',
            greetings: 'Tinchlik va xotirjamlik sizga yor bo\'lsin. Chuqur nafas oling. Bugun sizni nimalar bezovta qilmoqda?'
        }
    };

    // Initialize system prompt
    systemPrompt.value = personas[activePersona].prompt;

    // Sidebar & Settings Panel Toggle
    menuBtn.addEventListener('click', () => sidebar.classList.add('active'));
    closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('active'));
    
    settingsToggleBtn.addEventListener('click', () => {
        settingsPanel.classList.toggle('collapsed');
        settingsPanel.classList.toggle('active');
    });
    closePanelBtn.addEventListener('click', () => {
        settingsPanel.classList.add('collapsed');
        settingsPanel.classList.remove('active');
    });

    // Theme Toggle
    themeToggleBtn.addEventListener('click', () => {
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            themeIcon.className = 'fa-solid fa-sun';
            currentTheme = 'light';
        } else {
            document.documentElement.removeAttribute('data-theme');
            themeIcon.className = 'fa-solid fa-moon';
            currentTheme = 'dark';
        }
    });

    // Creativity Slider
    tempSlider.addEventListener('input', (e) => {
        tempValue.textContent = e.target.value;
    });

    // Change Active Persona
    personaOptions.forEach(option => {
        option.addEventListener('click', () => {
            personaOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            
            activePersona = option.dataset.persona;
            
            // Update Header UI
            headerPersonaAvatar.innerHTML = personas[activePersona].avatar;
            headerPersonaName.textContent = personas[activePersona].name;
            headerPersonaStatus.textContent = personas[activePersona].status;
            
            // Update System Prompt
            systemPrompt.value = personas[activePersona].prompt;
            
            // Close settings panel on smaller screens
            if (window.innerWidth <= 1024) {
                settingsPanel.classList.add('collapsed');
                settingsPanel.classList.remove('active');
            }

            // If empty chat, show persona greeting
            if (messagesContainer.querySelector('.message-row') === null) {
                welcomeScreen.style.display = 'none';
                appendMessage('ai', personas[activePersona].greetings);
            }
        });
    });

    // Input actions: Attachments
    attachBtn.addEventListener('click', () => {
        isAttached = !isAttached;
        attachmentPreview.style.display = isAttached ? 'block' : 'none';
    });
    
    removeAttachBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isAttached = false;
        attachmentPreview.style.display = 'none';
    });

    // Micro-animation for Microphone
    let isRecording = false;
    micBtn.addEventListener('click', () => {
        isRecording = !isRecording;
        if (isRecording) {
            micBtn.classList.add('active');
            chatInput.placeholder = "Eshitilmoqda...";
            
            // Simulate voice-to-text after 2.5 seconds
            setTimeout(() => {
                if (isRecording) {
                    chatInput.value = "NexusAI bilan ishlash juda qulay va chiroyli!";
                    chatInput.focus();
                    resetMic();
                }
            }, 2500);
        } else {
            resetMic();
        }
    });

    function resetMic() {
        isRecording = false;
        micBtn.classList.remove('active');
        chatInput.placeholder = "Xabaringizni yozing...";
    }

    // New Chat & History Handling
    function renderHistory() {
        historyList.innerHTML = '';
        chatSessions.forEach(session => {
            const item = document.createElement('div');
            item.className = `history-item ${session.active ? 'active' : ''}`;
            item.innerHTML = `
                <i class="fa-regular fa-message"></i>
                <span>${session.title}</span>
                <button class="delete-history-btn" data-id="${session.id}">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;
            
            // Click to switch chat
            item.addEventListener('click', (e) => {
                if (e.target.closest('.delete-history-btn')) return;
                switchSession(session.id);
            });

            // Delete chat
            const delBtn = item.querySelector('.delete-history-btn');
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteSession(session.id);
            });

            historyList.appendChild(item);
        });
    }

    newChatBtn.addEventListener('click', () => {
        const newId = chatSessions.length > 0 ? Math.max(...chatSessions.map(s => s.id)) + 1 : 1;
        chatSessions.forEach(s => s.active = false);
        chatSessions.push({
            id: newId,
            title: `Yangi suhbat ${newId}`,
            active: true,
            messages: []
        });
        activeChatId = newId;
        
        // Reset View
        messagesContainer.innerHTML = '';
        welcomeScreen.style.display = 'flex';
        renderHistory();
        
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('active');
        }
    });

    function switchSession(id) {
        chatSessions.forEach(s => s.active = s.id === id);
        activeChatId = id;
        renderHistory();
        
        // Load messages
        messagesContainer.innerHTML = '';
        const activeSession = chatSessions.find(s => s.id === id);
        
        if (activeSession.messages.length === 0) {
            welcomeScreen.style.display = 'flex';
        } else {
            welcomeScreen.style.display = 'none';
            activeSession.messages.forEach(msg => {
                appendMessage(msg.role, msg.text, msg.attached, false);
            });
        }

        if (window.innerWidth <= 768) {
            sidebar.classList.remove('active');
        }
    }

    function deleteSession(id) {
        chatSessions = chatSessions.filter(s => s.id !== id);
        if (chatSessions.length === 0) {
            chatSessions.push({ id: 1, title: 'Boshlang\'ich suhbat', active: true, messages: [] });
            activeChatId = 1;
        } else if (activeChatId === id) {
            chatSessions[0].active = true;
            activeChatId = chatSessions[0].id;
        }
        switchSession(activeChatId);
    }

    // Append Message helper
    function appendMessage(role, text, attached = false, save = true) {
        if (save) {
            const activeSession = chatSessions.find(s => s.id === activeChatId);
            if (activeSession) {
                activeSession.messages.push({ role, text, attached });
                // Update history title based on first user message
                if (role === 'user' && activeSession.title.startsWith('Yangi suhbat') || activeSession.title === 'Boshlang\'ich suhbat') {
                    activeSession.title = text.length > 20 ? text.substring(0, 20) + '...' : text;
                    renderHistory();
                }
            }
        }

        const messageRow = document.createElement('div');
        messageRow.className = `message-row ${role}`;
        
        const avatarHTML = role === 'user' ? 'U' : personas[activePersona].avatar;
        
        messageRow.innerHTML = `
            <div class="message-avatar">
                ${avatarHTML}
            </div>
            <div class="message-bubble">
                ${attached ? `<div class="bubble-attachment"><img src="./assets/hero.png" alt="Attachment"></div>` : ''}
                <div class="bubble-text"></div>
            </div>
        `;
        
        messagesContainer.appendChild(messageRow);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        const textDiv = messageRow.querySelector('.bubble-text');
        
        if (role === 'ai') {
            // Typing stream effect
            let i = 0;
            textDiv.innerHTML = '<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
            
            setTimeout(() => {
                textDiv.innerHTML = '';
                // Render with code highlight support
                function typeText() {
                    if (i < text.length) {
                        const char = text.charAt(i);
                        // Check if we have code block markdown
                        if (text.substring(i).startsWith('```')) {
                            const closeIdx = text.indexOf('```', i + 3);
                            if (closeIdx !== -1) {
                                const codeBlock = text.substring(i, closeIdx + 3);
                                textDiv.innerHTML += parseMarkdown(codeBlock);
                                i = closeIdx + 3;
                            } else {
                                textDiv.innerHTML += char;
                                i++;
                            }
                        } else {
                            textDiv.innerHTML += char;
                            i++;
                        }
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                        setTimeout(typeText, 10);
                    } else {
                        // Formatting check after full stream
                        textDiv.innerHTML = parseMarkdown(text);
                    }
                }
                typeText();
            }, 800);
        } else {
            textDiv.innerHTML = parseMarkdown(text);
        }
    }

    // Markdown simple parser
    function parseMarkdown(text) {
        let parsed = text;
        // Parse code blocks ```lang ... ```
        parsed = parsed.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang}">${escapeHTML(code.trim())}</code></pre>`;
        });
        // Parse inline code `code`
        parsed = parsed.replace(/`([^`]+)`/g, '<code>$1</code>');
        // Parse linebreaks
        parsed = parsed.replace(/\n/g, '<br>');
        return parsed;
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    // Send Input Action
    function handleSend() {
        const text = chatInput.value.trim();
        if (!text && !isAttached) return;
        
        welcomeScreen.style.display = 'none';
        
        // Append user message
        appendMessage('user', text, isAttached);
        
        // Reset input fields
        chatInput.value = '';
        chatInput.style.height = 'auto';
        isAttached = false;
        attachmentPreview.style.display = 'none';
        
        // Response Generation (Groq API or Fallback)
        getAIResponse(text);
    }

    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // Auto-expand textarea
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = (chatInput.scrollHeight) + 'px';
    });

    // Suggestion cards clicking
    const suggestionCards = document.querySelectorAll('.suggestion-card');
    suggestionCards.forEach(card => {
        card.addEventListener('click', () => {
            const prompt = card.dataset.prompt;
            chatInput.value = prompt;
            handleSend();
        });
    });

    // Reset settings
    resetSettingsBtn.addEventListener('click', () => {
        tempSlider.value = 0.7;
        tempValue.textContent = '0.7';
        systemPrompt.value = personas[activePersona].prompt;
        apiKeyInput.value = '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';
        localStorage.removeItem('groq_api_key');
    });

    saveSettingsBtn.addEventListener('click', () => {
        // Save key to localStorage
        localStorage.setItem('groq_api_key', apiKeyInput.value.trim());
        
        // Simple visual feedback
        saveSettingsBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saqlandi';
        setTimeout(() => {
            saveSettingsBtn.innerHTML = 'Saqlash';
        }, 1500);
    });

    // Fetch streaming responses from Groq
    async function getAIResponse(userInput) {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            simulateAIResponseFallback(userInput);
            return;
        }

        const activeSession = chatSessions.find(s => s.id === activeChatId);
        if (!activeSession) return;

        // Build messages payload
        const messagesList = [
            { role: 'system', content: systemPrompt.value || personas[activePersona].prompt }
        ];

        // Add context history (excluding the very last slot because we are about to push)
        activeSession.messages.forEach(msg => {
            messagesList.push({
                role: msg.role === 'ai' ? 'assistant' : 'user',
                content: msg.text
            });
        });

        // Add AI bubble to DOM with typing indicator
        const messageRow = document.createElement('div');
        messageRow.className = `message-row ai`;
        messageRow.innerHTML = `
            <div class="message-avatar">
                ${personas[activePersona].avatar}
            </div>
            <div class="message-bubble">
                <div class="bubble-text">
                    <div class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        `;
        messagesContainer.appendChild(messageRow);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        const textDiv = messageRow.querySelector('.bubble-text');
        let accumulatedResponse = '';

        try {
            // Determine model name
            let modelName = 'llama-3.1-8b-instant';
            if (activePersona === 'coder') modelName = 'llama-3.1-8b-instant';
            
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: messagesList,
                    temperature: parseFloat(tempSlider.value),
                    stream: true
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || `Server error: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            let isFirstChunk = true;

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep partial line

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;
                    
                    if (trimmed.startsWith('data: ')) {
                        const dataStr = trimmed.slice(6);
                        if (dataStr === '[DONE]') {
                            break;
                        }
                        try {
                            const json = JSON.parse(dataStr);
                            const content = json.choices[0].delta?.content || '';
                            if (content) {
                                if (isFirstChunk) {
                                    textDiv.innerHTML = '';
                                    isFirstChunk = false;
                                }
                                accumulatedResponse += content;
                                textDiv.innerHTML = parseMarkdown(accumulatedResponse);
                                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                            }
                        } catch (e) {
                            // Ignored (incomplete SSE chunk JSON)
                        }
                    }
                }
            }

            // Save the complete response to session history memory
            activeSession.messages.push({ role: 'ai', text: accumulatedResponse });

        } catch (error) {
            console.error('Groq API Call Failed:', error);
            textDiv.innerHTML = `<span style="color: var(--accent); font-weight: 600;"><i class="fa-solid fa-triangle-exclamation"></i> Groq API Xatoligi:</span><br>${error.message}`;
        }
    }

    // Simulated Fallback Responses
    function simulateAIResponseFallback(userInput) {
        let aiText = "";
        
        if (activePersona === 'coder') {
            if (userInput.toLowerCase().includes('saralash') || userInput.toLowerCase().includes('sort')) {
                aiText = "Mana Python dasturlash tilida tezkor saralash (Quick Sort) algoritmiga misol:\n\n```python\ndef quick_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quick_sort(left) + middle + quick_sort(right)\n\n# Tekshirib ko'ramiz:\ntest_arr = [3, 6, 8, 10, 1, 2, 1]\nprint(\"Saralangan massiv:\", quick_sort(test_arr))\n```\n\nBu algoritm massivni o'rtacha `O(n log n)` vaqt murakkabligida saralaydi. Yana qanday funksiyani yozib beray?";
            } else {
                aiText = "Tushunarli! Loyihangiz uchun kod yozishga tayyorman. Mana uning asosi:\n\n```javascript\n// Dasturingiz uchun namuna kod\nconst startNexus = (config) => {\n  console.log(\"NexusAI Master Coder ishga tushdi...\", config);\n  return { status: 'online', code: 200 };\n};\n\nexport default startNexus;\n```\n\nIltimos, vazifani to'liqroq ta'riflang, men sizga aniq yechim taqdim etaman.";
            }
        } 
        else if (activePersona === 'manga') {
            if (userInput.toLowerCase().includes('hikoya') || userInput.toLowerCase().includes('personaj') || userInput.toLowerCase().includes('character')) {
                aiText = "Ajoyib g'oya! Keling, birgalikda shunday qahramon va sahna yaratamiz:\n\n**Qahramon**: *Ryuto* - shahar ustidagi osmono'par binolar tomida sehrli kuchlarini sinovdan o'tkazadigan yosh qahramon. Spiki sochlari shom payti shamolda hilpiraydi.\n\n**Vizual uslub**: Qora-oq manga stili, kuchli kontrast bilan chizilgan chiziqlar va sunset (quyosh botishi) effektini beruvchi `screentones` (ekran ohanglari).\n\nSiz ko'rib turgan **rooftop sunset** rasmimiz ayni shu g'oyaning mukammal ifodasidir. Unga yana qanday detallar qo'shamiz? Ehtimol, uning yonida sehrli maxluq yoxud uzoqdan ko'rinayotgan futuristik shahar manzarasi?";
            } else {
                aiText = "Sizning kreativ xohishingiz bo'yicha yangi manga sahnalarini chizamiz! Men siz biriktirgan yoki yuqoridagi **Rooftop Sunset** qahramoni asosida syujet yaratishim mumkin. Keling, uning hikoyasini yozamiz. Qahramonga qanday sehrli qurol qo'shmoqchisiz?";
            }
        } 
        else if (activePersona === 'zen') {
            aiText = "Sizning tinchligingiz va ruhiy muvozanatingiz eng muhimidir. Kun davomida charchoq yoki xavotirni kamaytirish uchun quyidagi usulni sinab ko'ring:\n\n1. O'tiring, yelkalaringizni bo'shating.\n2. 4 soniya davomida burningiz orqali chuqur nafas oling.\n3. Nafasni 4 soniya ushlab turing.\n4. 6 soniya davomida og'zingizdan sekin nafas chiqaring.\n\nBu mashq sizning parasimpatik asab tizimingizni faollashtiradi va yurak urishini joyiga keltiradi. Unutmang, siz kuchlisiz va har qanday qiyinchilik o'tkinchidir. Menga nima sizni bezovta qilayotganini ayting, birga yechim topamiz.";
        } 
        else {
            aiText = "Albatta, sizga bu masalama yordam berishdan xursandman. NexusAI yordamida loyihalaringiz samaradorligini oshirishingiz mumkin. Keling, buni birgalikda ko'rib chiqamiz. Savolingizni aniqroq bering va biz kerakli ma'lumotlarni yig'amiz.";
        }

        appendMessage('ai', aiText);
    }

    // Load initial layout
    renderHistory();
});