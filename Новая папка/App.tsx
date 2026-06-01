import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Types
interface Message {
  role: 'user' | 'ai';
  text: string;
  attached?: boolean;
}

interface ChatSession {
  id: number;
  title: string;
  messages: Message[];
}

interface Persona {
  name: string;
  status: string;
  avatar: string; // FontAwesome class or image path
  isImage?: boolean;
  prompt: string;
  greetings: string;
}

export default function App() {
  // Themes
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Sidebar & Layout Toggles
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);

  // Attachment State
  const [isAttached, setIsAttached] = useState(false);

  // Mic state
  const [isRecording, setIsRecording] = useState(false);

  // Persona State
  const [activePersona, setActivePersona] = useState<string>('assistant');
  const [temp, setTemp] = useState<number>(0.7);
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('groq_api_key') || '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';
  });

  // Chats State
  const [sessions, setSessions] = useState<ChatSession[]>([
    { id: 1, title: 'Boshlang\'ich suhbat', messages: [] }
  ]);
  const [activeSessionId, setActiveSessionId] = useState<number>(1);
  const [inputValue, setInputValue] = useState<string>('');
  
  // Ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Personas Database
  const personas: Record<string, Persona> = {
    assistant: {
      name: 'General Assistant',
      status: 'Sizning universal yordamchingiz',
      avatar: 'fa-solid fa-robot',
      prompt: 'Siz aqlli, muloyim va foydali sun\'iy intellekt yordamchisiz. Foydalanuvchiga har qanday mavzuda to\'g\'ri va aniq ma\'lumot bering.',
      greetings: 'Salom! Men sizning shaxsiy yordamchingizman. Bugun sizga qanday yordam bera olaman?'
    },
    coder: {
      name: 'Code Master',
      status: 'Dasturlash va refaktoring',
      avatar: 'fa-solid fa-code',
      prompt: 'Siz yuqori malakali dasturchisiz. Faqat dasturlash, algoritm va kod yozish bilan bog\'liq savollarga batafsil, toza kod va tushuntirishlar bilan javob berasiz.',
      greetings: 'Salom, dasturchi do\'stim! Qaysi tilda kod yozamiz yoki qanday algoritmik muammoni hal qilamiz?'
    },
    manga: {
      name: 'Manga Creative',
      status: 'Manga va art g\'oyalari',
      avatar: './assets/hero.png',
      isImage: true,
      prompt: 'Siz professional manga yozuvchisi va illyustratorisiz. Foydalanuvchiga kreativ qahramonlar, syujetlar va vizual chizmalar yaratishda yordam berasiz.',
      greetings: 'Salom! Men ijodiy manga yordamchisiman. Rooftop Sunset rasmimiz ajoyib chiqdi. Yana qanday qahramonlar yoki sahnalar yaratamiz?'
    },
    zen: {
      name: 'Zen Coach',
      status: 'Psixologik ko\'mak va tinchlik',
      avatar: 'fa-solid fa-seedling',
      prompt: 'Siz xotirjam va dono meditatsiya ustozi hamda psixologsiz. Foydalanuvchilarga stressdan xalos bo\'lish, xotirjamlik va ichki tinchlikni topish bo\'yicha maslahatlar berasiz.',
      greetings: 'Tinchlik va xotirjamlik sizga yor bo\'lsin. Chuqur nafas oling. Bugun sizni nimalar bezovta qilmoqda?'
    }
  };

  // Sync initial system prompt
  useEffect(() => {
    setSystemPrompt(personas[activePersona].prompt);
  }, [activePersona]);

  // Handle Theme effect
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessions, activeSessionId]);

  // Suggestions Card Click
  const handleSuggestionClick = (promptText: string) => {
    setInputValue(promptText);
    sendMessage(promptText);
  };

  // Delete chat session
  const deleteSession = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated = sessions.filter(s => s.id !== id);
    if (updated.length === 0) {
      updated = [{ id: 1, title: 'Boshlang\'ich suhbat', messages: [] }];
      setActiveSessionId(1);
    } else if (activeSessionId === id) {
      setActiveSessionId(updated[0].id);
    }
    setSessions(updated);
  };

  // Create new chat session
  const createNewChat = () => {
    const nextId = sessions.length > 0 ? Math.max(...sessions.map(s => s.id)) + 1 : 1;
    const newSession: ChatSession = {
      id: nextId,
      title: `Yangi suhbat ${nextId}`,
      messages: []
    };
    setSessions([...sessions, newSession]);
    setActiveSessionId(nextId);
    setSidebarOpen(false);
  };

  // Mic Simulation
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setInputValue("NexusAI bilan ishlash juda qulay va chiroyli!");
        setIsRecording(false);
      }, 2500);
    }
  };

  // Parse custom simulated markdown
  const renderTextContent = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const lang = match ? match[1] : '';
        const code = match ? match[2] : part.slice(3, -3);
        return (
          <pre key={index}>
            <code className={`language-${lang}`}>{code.trim()}</code>
          </pre>
        );
      } else if (part.startsWith('`')) {
        return <code key={index}>{part.slice(1, -1)}</code>;
      }
      return part.split('\n').map((line, i) => (
        <span key={`${index}-${i}`}>
          {line}
          {i < part.split('\n').length - 1 && <br />}
        </span>
      ));
    });
  };

  // Send Message logic
  const sendMessage = (customText?: string) => {
    const textToSend = customText || inputValue.trim();
    if (!textToSend && !isAttached) return;

    // 1. Add User Message
    const updatedSessions = sessions.map(session => {
      if (session.id === activeSessionId) {
        const nextMessages = [...session.messages, { role: 'user' as const, text: textToSend, attached: isAttached }];
        let nextTitle = session.title;
        // Rename title on first message
        if (session.title.startsWith('Yangi suhbat') || session.title === 'Boshlang\'ich suhbat') {
          nextTitle = textToSend.length > 20 ? textToSend.substring(0, 20) + '...' : textToSend;
        }
        return {
          ...session,
          title: nextTitle,
          messages: nextMessages
        };
      }
      return session;
    });

    setSessions(updatedSessions);
    setInputValue('');
    setIsAttached(false);

    // 2. Simulate AI Typing response
    simulateResponse(textToSend);
  };

  const simulateResponse = async (userInput: string) => {
    // 1. Add Typing indicator temporarily
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          messages: [...s.messages, { role: 'ai', text: '...' }]
        };
      }
      return s;
    }));

    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
    const cleanApiKey = apiKey.trim();

    // Fallback if no key is entered
    if (!cleanApiKey) {
      simulateFallbackResponse(userInput);
      return;
    }

    // Build history payload for Groq
    const messagesList: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt || personas[activePersona].prompt }
    ];

    activeSession.messages.forEach(msg => {
      messagesList.push({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.text
      });
    });

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanApiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: messagesList,
          temperature: temp,
          stream: true
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Response body is not readable");

      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulated = '';
      let isFirst = true;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') break;
            try {
              const json = JSON.parse(dataStr);
              const content = json.choices[0].delta?.content || '';
              if (content) {
                accumulated += content;
                const currentAccumulated = accumulated;
                
                setSessions(prev => prev.map(s => {
                  if (s.id === activeSessionId) {
                    const otherMsgs = s.messages.slice(0, -1);
                    return {
                      ...s,
                      messages: [...otherMsgs, { role: 'ai', text: currentAccumulated }]
                    };
                  }
                  return s;
                }));
              }
            } catch (e) {
              // Ignore incomplete JSON
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Groq API Error in React:', error);
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          const otherMsgs = s.messages.slice(0, -1);
          return {
            ...s,
            messages: [...otherMsgs, { role: 'ai', text: `Groq API Xatoligi: ${error.message}` }]
          };
        }
        return s;
      }));
    }
  };

  const simulateFallbackResponse = (userInput: string) => {
    let responseText = "";

    if (activePersona === 'coder') {
      if (userInput.toLowerCase().includes('saralash') || userInput.toLowerCase().includes('sort')) {
        responseText = "Mana Python dasturlash tilida tezkor saralash (Quick Sort) algoritmiga misol:\n\n```python\ndef quick_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quick_sort(left) + middle + quick_sort(right)\n\n# Tekshirib ko'ramiz:\ntest_arr = [3, 6, 8, 10, 1, 2, 1]\nprint(\"Saralangan massiv:\", quick_sort(test_arr))\n```\n\nBu algoritm massivni o'rtacha `O(n log n)` vaqt murakkabligida saralaydi. Yana qanday funksiyani yozib beray?";
      } else {
        responseText = "Tushunarli! Loyihangiz uchun kod yozishga tayyorman. Mana uning asosi:\n\n```javascript\n// Dasturingiz uchun namuna kod\nconst startNexus = (config) => {\n  console.log(\"NexusAI Master Coder ishga tushdi...\", config);\n  return { status: 'online', code: 200 };\n};\n\nexport default startNexus;\n```\n\nIltimos, vazifani to'liqroq ta'riflang, men sizga aniq yechim taqdim etaman.";
      }
    } else if (activePersona === 'manga') {
      if (userInput.toLowerCase().includes('hikoya') || userInput.toLowerCase().includes('personaj') || userInput.toLowerCase().includes('character')) {
        responseText = "Ajoyib g'oya! Keling, birgalikda shunday qahramon va sahna yaratamiz:\n\n**Qahramon**: *Ryuto* - shahar ustidagi osmono'par binolar tomida sehrli kuchlarini sinovdan o'tkazadigan yosh qahramon. Spiki sochlari shom payti shamolda hilpiraydi.\n\n**Vizual uslub**: Qora-oq manga stili, kuchli kontrast bilan chizilgan chiziqlar va sunset (quyosh botishi) effektini beruvchi `screentones` (ekran ohanglari).\n\nSiz ko'rib turgan **rooftop sunset** rasmimiz ayni shu g'oyaning mukammal ifodasidir. Unga yana qanday detallar qo'shamiz? Ehtimol, uning yonida sehrli maxluq yoxud uzoqdan ko'rinayotgan futuristik shahar manzarasi?";
      } else {
        responseText = "Sizning kreativ xohishingiz bo'yicha manga sahnalarini chizamiz! Men siz biriktirgan yoki yuqoridagi **Rooftop Sunset** qahramoni asosida syujet yaratishim mumkin. Keling, uning hikoyasini yozamiz. Qahramonga qanday sehrli qurol qo'shmoqchisiz?";
      }
    } else if (activePersona === 'zen') {
      responseText = "Sizning tinchligingiz va ruhiy muvozanatingiz eng muhimidir. Kun davomida charchoq yoki xavotirni kamaytirish uchun quyidagi usulni sinab ko'ring:\n\n1. O'tiring, yelkalaringizni bo'shating.\n2. 4 soniya davomida burningiz orqali chuqur nafas oling.\n3. Nafasni 4 soniya ushlab turing.\n4. 6 soniya davomida og'zingizdan sekin nafas chiqaring.\n\nBu mashq sizning parasimpatik asab tizimingizni faollashtiradi va yurak urishini joyiga keltiradi. Unutmang, siz kuchlisiz va har qanday qiyinchilik o'tkinchidir. Menga nima sizni bezovta qilayotganini ayting, birga yechim topamiz.";
    } else {
      responseText = "Albatta, sizga bu masalada yordam berishdan xursandman. NexusAI yordamida loyihalaringiz samaradorligini oshirishingiz mumkin. Keling, buni birgalikda ko'rib chiqamiz. Savolingizni aniqroq bering va biz kerakli ma'lumotlarni yig'amiz.";
    }

    setTimeout(() => {
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          const cleanMsgs = s.messages.filter(m => m.text !== '...');
          return {
            ...s,
            messages: [...cleanMsgs, { role: 'ai', text: responseText }]
          };
        }
        return s;
      }));
    }, 1200);
  };

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const activePersonaConfig = personas[activePersona];

  return (
    <div className="app-container">
      {/* Sidebar: Chat History */}
      <aside className={`sidebar ${sidebarOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-glow"></div>
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>NexusAI</span>
          </div>
          <button className="icon-btn close-sidebar" onClick={() => setSidebarOpen(false)} title="Close Sidebar">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <button className="new-chat-btn" onClick={createNewChat}>
          <i className="fa-solid fa-plus"></i>
          <span>Yangi Chat</span>
        </button>

        <div className="history-section">
          <div className="section-title">Bugungi suhbatlar</div>
          <div className="history-list">
            {sessions.map(session => (
              <div 
                key={session.id} 
                className={`history-item ${session.id === activeSessionId ? 'active' : ''}`}
                onClick={() => {
                  setActiveSessionId(session.id);
                  setSidebarOpen(false);
                }}
              >
                <i className="fa-regular fa-message"></i>
                <span>{session.title}</span>
                <button className="delete-history-btn" onClick={(e) => deleteSession(session.id, e)}>
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">U</div>
            <div className="user-info">
              <div className="user-name">Foydalanuvchi</div>
              <div className="user-status">Premium A'zo</div>
            </div>
          </div>
          <button 
            className="icon-btn theme-toggle" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Mavzuni o'zgartirish"
          >
            <i className={`fa-solid ${theme === 'dark' ? 'fa-moon' : 'fa-sun'}`}></i>
          </button>
        </div>
      </aside>

      {/* Main Chat Screen */}
      <main className="chat-area">
        <header className="chat-header">
          <div className="header-left">
            <button className="icon-btn menu-btn" onClick={() => setSidebarOpen(true)} title="Open Sidebar">
              <i className="fa-solid fa-bars"></i>
            </button>
            <div className="active-persona-info">
              <div className="persona-avatar-header">
                {activePersonaConfig.isImage ? (
                  <img src={activePersonaConfig.avatar} alt="Persona" className="avatar-img" />
                ) : (
                  <i className={activePersonaConfig.avatar}></i>
                )}
              </div>
              <div>
                <h1 className="persona-name-header">{activePersonaConfig.name}</h1>
                <p className="persona-status-header">{activePersonaConfig.status}</p>
              </div>
            </div>
          </div>
          <div className="header-right">
            <button className="icon-btn" onClick={() => setSettingsOpen(!settingsOpen)} title="Parametrlarni ko'rsatish">
              <i className="fa-solid fa-sliders"></i>
            </button>
          </div>
        </header>

        {/* Message Panel */}
        <div className="messages-container">
          {activeSession.messages.length === 0 ? (
            <div className="welcome-screen">
              <div className="welcome-icon">
                <i className="fa-solid fa-wand-magic-sparkles"></i>
              </div>
              <h2>NexusAI-ga xush kelibsiz!</h2>
              <p>Sizga qanday yordam bera olaman? Quyidagi tayyor shablonlardan birini tanlashingiz yoki chatni boshlashingiz mumkin.</p>
              
              <div className="prompt-suggestions">
                <div 
                  className="suggestion-card" 
                  onClick={() => handleSuggestionClick("Menga python dasturlash tilida tezkor saralash algoritmini yozib ber.")}
                >
                  <i className="fa-solid fa-code"></i>
                  <div>
                    <h4>Kod yozish</h4>
                    <p>"Menga tezkor saralash algoritmini..."</p>
                  </div>
                </div>
                <div 
                  className="suggestion-card" 
                  onClick={() => handleSuggestionClick("Kreativ yondashuv bilan yangi anime qahramoni uchun hikoya va vizual ko'rinish yarat.")}
                >
                  <i className="fa-solid fa-paint-brush"></i>
                  <div>
                    <h4>Manga g'oya</h4>
                    <p>"Yangi anime qahramoni uchun hikoya..."</p>
                  </div>
                </div>
                <div 
                  className="suggestion-card" 
                  onClick={() => handleSuggestionClick("Stressli kunlardan qanday qilib osongina o'tib ketish mumkin? Menga tavsiyalar ber.")}
                >
                  <i className="fa-solid fa-seedling"></i>
                  <div>
                    <h4>Meditatsiya va ruhiyat</h4>
                    <p>"Stressli kunlardan qanday o'tish..."</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            activeSession.messages.map((msg, index) => (
              <div key={index} className={`message-row ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? 'U' : (
                    activePersonaConfig.isImage ? (
                      <img src={activePersonaConfig.avatar} alt="Persona" className="avatar-img" />
                    ) : (
                      <i className={activePersonaConfig.avatar}></i>
                    )
                  )}
                </div>
                <div className="message-bubble">
                  {msg.attached && (
                    <div className="bubble-attachment">
                      <img src="./assets/hero.png" alt="Attachment" />
                    </div>
                  )}
                  <div className="bubble-text">
                    {msg.text === '...' ? (
                      <div className="typing-indicator">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                      </div>
                    ) : (
                      renderTextContent(msg.text)
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <footer className="chat-input-container">
          <div className="input-actions-bar">
            {isAttached && (
              <div className="attachment-preview" style={{ display: 'block' }}>
                <img src="./assets/hero.png" alt="Manga Hero" />
                <button className="remove-attach" onClick={() => setIsAttached(false)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            )}
          </div>
          <div className="input-wrapper">
            <button className="input-action-btn" onClick={() => setIsAttached(!isAttached)} title="Rasm biriktirish">
              <i className="fa-solid fa-paperclip"></i>
            </button>
            <textarea 
              ref={inputRef}
              className="chat-input" 
              placeholder={isRecording ? "Eshitilmoqda..." : "Xabaringizni yozing..."}
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button className={`input-action-btn mic-btn ${isRecording ? 'active' : ''}`} onClick={toggleRecording} title="Ovozli kiritish">
              <i className="fa-solid fa-microphone"></i>
            </button>
            <button className="send-btn" onClick={() => sendMessage()} title="Yuborish">
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
          <div className="input-info">
            NexusAI xatoliklar qilishi mumkin. Muhim ma'lumotlarni tekshirib ko'ring.
          </div>
        </footer>
      </main>

      {/* Right Sidebar: Configuration Panel */}
      <aside className={`settings-panel ${settingsOpen ? '' : 'collapsed'}`}>
        <div className="panel-header">
          <h3>Persona Sozlamalari</h3>
          <button className="icon-btn close-panel" onClick={() => setSettingsOpen(false)}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="panel-section">
          <label className="section-label">Groq API Key</label>
          <input 
            type="password" 
            className="settings-input" 
            placeholder="gsk_..." 
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        <div className="panel-section">
          <label className="section-label">Modelni Tanlang</label>
          <div className="persona-selector">
            {Object.keys(personas).map(key => (
              <div 
                key={key} 
                className={`persona-option ${activePersona === key ? 'active' : ''}`}
                onClick={() => setActivePersona(key)}
              >
                <div className="avatar">
                  {personas[key].isImage ? (
                    <div className="avatar-img-wrapper">
                      <img src={personas[key].avatar} alt="Persona" className="avatar-img" />
                    </div>
                  ) : (
                    <i className={personas[key].avatar}></i>
                  )}
                </div>
                <div className="details">
                  <div className="name">{personas[key].name}</div>
                  <div className="desc">{personas[key].status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-section">
          <div className="slider-container">
            <div className="slider-header">
              <label>Creativity (Temperature)</label>
              <span>{temp}</span>
            </div>
            <input 
              type="range" 
              className="custom-slider" 
              min="0" 
              max="1" 
              step="0.1" 
              value={temp} 
              onChange={(e) => setTemp(parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div className="panel-section">
          <label className="section-label">Tizim Ko'rsatmasi (System Prompt)</label>
          <textarea 
            className="system-prompt-textarea" 
            value={systemPrompt} 
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Modelning o'zini qanday tutishini belgilang..."
          />
        </div>

        <div className="panel-footer-actions">
          <button 
            className="secondary-btn" 
            onClick={() => {
              setTemp(0.7);
              setSystemPrompt(personas[activePersona].prompt);
              setApiKey('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');
              localStorage.removeItem('groq_api_key');
            }}
          >
            Standart holatga qaytarish
          </button>
          <button 
            className="primary-btn" 
            onClick={() => {
              localStorage.setItem('groq_api_key', apiKey.trim());
              alert('Sozlamalar saqlandi!');
            }}
          >
            Saqlash
          </button>
        </div>
      </aside>
    </div>
  );
}
