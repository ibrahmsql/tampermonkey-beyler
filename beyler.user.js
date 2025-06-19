// ==UserScript==
// @name         beyler
// @namespace    http://tampermonkey.net/
// @version      0.3b
// @description  Replaces every chat message from linuxcu1 with "beyler"
// @match        https://btt.community/*
// @grant        none
// ==/UserScript==

// Author: pwish - https://github.com/Pwissh / https://gitlab.com/pwish/
// Date: June 18, 2025

// Contribution: ibrahimsql - https://x.com/ibrahimsql / https://github.com/ibrahmsql

//// okunabilir kod yazmak çok zor -pwish
  // we made this extension bc user "linuxcu1" kept typing "guys" then asking dumb qs lol so we made it as a joke hey linuxcu f u :D -ibrahimsql

(function() {
    'use strict';

    console.log('=== BEYLER ===');

    // DOM için constlar
    const SELECTORS = {
        messageContainer: '.chat-message-container',
        messageContent: '.chat-message-content',
        messageUsername: '.chat-message-info__username__name',
        messageText: '.chat-cooked',
        messageHiddenClass: '-user-info-hidden',
        threadContainer: '.chat-message-thread-indicator',
        threadUsername: '.chat-message-thread-indicator__last-reply-username',
        threadContent: '.chat-message-thread-indicator__last-reply-excerpt'
    };

    // ana config
    const TARGET_USERNAME = 'linuxcu1';
    const MESSAGE_REPLACEMENT_TEXT = '<p>beyler</p>';
    const THREAD_REPLACEMENT_TEXT = 'beyler';
    const MUTATION_DELAY = 100;
    const MAX_PROCESSED_ITEMS = 1000;
    const MAX_RETRIES = 3;

    // state
    const processedMessages = new Set();
    const processedThreadIndicators = new Set();
    let lastKnownUsername = null;
    let isProcessing = false;

    // mesaj ve threadler için unique id gen
    function generateUniqueId(container, isThread = false) {
        const dataId = container.getAttribute('data-id');
        if (dataId) return `${isThread ? 'thread-' : 'msg-'}${dataId}`;

        const usernameSelector = isThread ? SELECTORS.threadUsername : SELECTORS.messageUsername;
        const contentSelector = isThread ? SELECTORS.threadContent : SELECTORS.messageText;
        const username = container.querySelector(usernameSelector)?.textContent?.trim() || (isThread ? '' : lastKnownUsername || '');
        const messageText = container.querySelector(contentSelector)?.textContent?.trim() || '';
        return `${isThread ? 'thread-' : 'msg-'}${username}-${messageText}-${performance.now()}`;
    }

    // process edilmiş setleri temizle
    function pruneProcessedSet(set) {
        if (set.size > MAX_PROCESSED_ITEMS) {
            const iterator = set.values();
            for (let i = 0; i < set.size - MAX_PROCESSED_ITEMS / 2; i++) {
                set.delete(iterator.next().value);
            }
        }
    }

    // linuxcu1'in mesajlarını process et
    function modifyLinuxcuMessages(containers, retryCount = 0, forceReprocess = false) {
        containers.forEach(container => {
            const messageId = generateUniqueId(container);
            if (!forceReprocess && processedMessages.has(messageId)) return;

            const usernameElement = container.querySelector(SELECTORS.messageUsername);
            const isUserInfoHidden = container.classList.contains(SELECTORS.messageHiddenClass);
            const isContinuationMessage = !container.matches(SELECTORS.messageContainer) && container.matches(SELECTORS.messageContent);

            let username = null;
            if (usernameElement) {
                username = usernameElement.textContent.trim();
                lastKnownUsername = username;
            } else if (isUserInfoHidden || isContinuationMessage) {
                username = lastKnownUsername;
            }

            if (username === TARGET_USERNAME) {
                console.log('LINUXCU1 MESAJI BULUNDU!', { messageId });

                const messageContent = container.querySelector(SELECTORS.messageText);
                if (messageContent) {
                    const originalText = messageContent.innerHTML;
                    if (originalText === MESSAGE_REPLACEMENT_TEXT && !forceReprocess) {
                        console.log('Mesaj zaten "beyler", atlanıyor.', { messageId });
                        processedMessages.add(messageId);
                        return;
                    }

                    console.log('Eski mesaj:', originalText);
                    messageContent.innerHTML = MESSAGE_REPLACEMENT_TEXT;
                    console.log('Mesaj "beyler" olarak değiştirildi!');

                    processedMessages.add(messageId);
                    pruneProcessedSet(processedMessages);
                } else if (retryCount < MAX_RETRIES) {
                    console.log('Mesaj içeriği bulunamadı, tekrar denenecek.', {
                        messageId,
                        retryCount: retryCount + 1,
                        containerHtml: container.outerHTML.slice(0, 200)
                    });
                    setTimeout(() => modifyLinuxcuMessages([container], retryCount + 1, forceReprocess), MUTATION_DELAY);
                } else {
                    console.log('Mesaj içeriği bulunamadı, maksimum deneme sayısına ulaşıldı.', { messageId });
                    processedMessages.add(messageId);
                }
            }
        });
    }

    // linuxcu1'in thread indicatorlarını process et
    function modifyLinuxcuThreadIndicators(containers, forceReprocess = false) {
        containers.forEach(container => {
            const threadId = generateUniqueId(container, true);
            if (!forceReprocess && processedThreadIndicators.has(threadId)) return;

            const usernameElement = container.querySelector(SELECTORS.threadUsername);
            if (usernameElement && usernameElement.textContent.trim() === TARGET_USERNAME) {
                console.log('LINUXCU1 THREAD MESAJI BULUNDU!', { threadId });

                const threadContent = container.querySelector(SELECTORS.threadContent);
                if (threadContent) {
                    const originalText = threadContent.innerHTML;
                    if (originalText === THREAD_REPLACEMENT_TEXT && !forceReprocess) {
                        console.log('Thread mesaj zaten "beyler", atlanıyor.', { threadId });
                        processedThreadIndicators.add(threadId);
                        return;
                    }

                    console.log('Eski thread mesaj:', originalText);
                    threadContent.innerHTML = THREAD_REPLACEMENT_TEXT;
                    console.log('Thread mesaj "beyler" olarak değiştirildi!');

                    processedThreadIndicators.add(threadId);
                    pruneProcessedSet(processedThreadIndicators);

                    // ana mesaj containerını ve devam mesajlarını process et
                    const parentMessageContainer = container.closest(SELECTORS.messageContainer);
                    if (parentMessageContainer) {
                        modifyLinuxcuMessages([parentMessageContainer], 0, true);
                        // devam mesajlarını bul (tekli .chat-message-content)
                        const siblings = parentMessageContainer.nextElementSibling;
                        let currentSibling = siblings;
                        const continuationMessages = [];
                        while (currentSibling && currentSibling.matches(SELECTORS.messageContent)) {
                            continuationMessages.push(currentSibling);
                            currentSibling = currentSibling.nextElementSibling;
                        }
                        if (continuationMessages.length) {
                            modifyLinuxcuMessages(continuationMessages, 0, true);
                        }
                    }
                } else {
                    console.log('Thread mesaj içeriği bulunamadı, tekrar denenecek.', { threadId });
                    setTimeout(() => modifyLinuxcuThreadIndicators([container], forceReprocess), MUTATION_DELAY);
                }
            }
        });
    }

    // bir thread tekrar açıldığında processi sıfırla
    function resetThreadProcessing(threadContainer) {
        console.log('Thread yeniden açıldı, işleme sıfırlanıyor...');
        const messages = threadContainer.querySelectorAll(SELECTORS.messageContainer);
        const threadIndicators = threadContainer.querySelectorAll(SELECTORS.threadContainer);

        // sözü geçen threadin mesajlarını ve thread indicatorlarını sıfırla
        messages.forEach(container => {
            const messageId = generateUniqueId(container);
            processedMessages.delete(messageId);
        });
        threadIndicators.forEach(container => {
            const threadId = generateUniqueId(container, true);
            processedThreadIndicators.delete(threadId);
        });

        // mesaj ve threadleri baştan process et
        modifyLinuxcuMessages([...messages], 0, true);
        modifyLinuxcuThreadIndicators([...threadIndicators], true);

        // ana mesaj containerını ve devam mesajlarını process et
        const parentMessageContainer = threadContainer.closest(SELECTORS.messageContainer);
        if (parentMessageContainer) {
            modifyLinuxcuMessages([parentMessageContainer], 0, true);
            const siblings = parentMessageContainer.nextElementSibling;
            let currentSibling = siblings;
            const continuationMessages = [];
            while (currentSibling && currentSibling.matches(SELECTORS.messageContent)) {
                continuationMessages.push(currentSibling);
                currentSibling = currentSibling.nextElementSibling;
            }
            if (continuationMessages.length) {
                modifyLinuxcuMessages(continuationMessages, 0, true);
            }
        }
    }

    // MutationObserver optimize edition
    const observer = new MutationObserver((mutations) => {
        if (isProcessing) return;

        const newMessageContainers = new Set();
        const newContentContainers = new Set();
        const newThreadContainers = new Set();
        const reopenedThreads = new Set();

        mutations.forEach(mutation => {
            if (!mutation.addedNodes.length) return;

            mutation.addedNodes.forEach(node => {
                if (node.nodeType !== 1) return;

                if (node.matches(SELECTORS.messageContainer)) {
                    newMessageContainers.add(node);
                } else if (node.matches(SELECTORS.messageContent)) {
                    newContentContainers.add(node);
                } else if (node.matches(SELECTORS.threadContainer)) {
                    newThreadContainers.add(node);
                    if (node.querySelector(SELECTORS.messageContainer)) {
                        reopenedThreads.add(node);
                    }
                } else {
                    node.querySelectorAll(SELECTORS.messageContainer).forEach(container => {
                        newMessageContainers.add(container);
                    });
                    node.querySelectorAll(SELECTORS.messageContent).forEach(container => {
                        if (!container.closest(SELECTORS.messageContainer)) {
                            newContentContainers.add(container);
                        }
                    });
                    node.querySelectorAll(SELECTORS.threadContainer).forEach(container => {
                        newThreadContainers.add(container);
                        if (container.querySelector(SELECTORS.messageContainer)) {
                            reopenedThreads.add(container);
                        }
                    });
                }
            });
        });

        if (newMessageContainers.size || newContentContainers.size || newThreadContainers.size || reopenedThreads.size) {
            isProcessing = true;
            setTimeout(() => {
                if (reopenedThreads.size) {
                    reopenedThreads.forEach(thread => resetThreadProcessing(thread));
                }
                if (newMessageContainers.size) {
                    modifyLinuxcuMessages([...newMessageContainers]);
                }
                if (newContentContainers.size) {
                    modifyLinuxcuMessages([...newContentContainers]);
                }
                if (newThreadContainers.size) {
                    modifyLinuxcuThreadIndicators([...newThreadContainers]);
                }
                isProcessing = false;
            }, MUTATION_DELAY);
        }
    });

    // ana mesajları ve thread indicatorlarını process et, yine...
    function checkInitialMessages() {
        console.log('Mevcut mesajlar kontrol ediliyor...');
        const messageContainers = [...document.querySelectorAll(SELECTORS.messageContainer)];
        const contentContainers = [...document.querySelectorAll(SELECTORS.messageContent)].filter(
            container => !container.closest(SELECTORS.messageContainer)
        );
        const threadContainers = [...document.querySelectorAll(SELECTORS.threadContainer)];

        // önce tüm mesajları process et
        modifyLinuxcuMessages([...messageContainers, ...contentContainers]);

        //  thread indicatorlarını ve ana mesajları process et
        threadContainers.forEach(thread => {
            modifyLinuxcuThreadIndicators([thread], true);
            const parentMessageContainer = thread.closest(SELECTORS.messageContainer);
            if (parentMessageContainer) {
                modifyLinuxcuMessages([parentMessageContainer], 0, true);
                const siblings = parentMessageContainer.nextElementSibling;
                let currentSibling = siblings;
                const continuationMessages = [];
                while (currentSibling && currentSibling.matches(SELECTORS.messageContent)) {
                    continuationMessages.push(currentSibling);
                    currentSibling = currentSibling.nextElementSibling;
                }
                if (continuationMessages.length) {
                    modifyLinuxcuMessages(continuationMessages, 0, true);
                }
            }
        });
    }

    // observer'ı başlat
    function startObserver() {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        console.log('Observer başlatıldı.');
    }

    // init'i başlat
    function init() {
        startObserver();
        setTimeout(checkInitialMessages, 1000);

        // thread tekrar açıldı mı açılmadı mı anlamak için click listener ekle
        document.addEventListener('click', (event) => {
            const threadIndicator = event.target.closest(SELECTORS.threadContainer);
            if (threadIndicator) {
                setTimeout(() => resetThreadProcessing(threadIndicator), MUTATION_DELAY);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.addEventListener('beforeunload', () => observer.disconnect());

    console.log('Eklenti hazır - linuxcu1 mesajları izleniyor...');
})();
