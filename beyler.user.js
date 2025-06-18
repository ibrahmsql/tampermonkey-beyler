// ==UserScript==
// @name         beyler
// @namespace    http://tampermonkey.net/
// @version      0.1b
// @description  Replace every chat message from linuxcu1 with "beyler"
// @match        https://btt.community/chat/c/sohbet/2
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // yeni chat mesajlarını incelemek için
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // element mi değil mi kontrol et
                    const usernameElement = node.querySelector('.chat-message-info__username__name'); // username seçici
                    const messageElement = node.querySelector('.chat-message-text .chat-cooked'); // mesaj seçici

                    if (usernameElement && messageElement && usernameElement.textContent.trim() === 'linuxcu1') {
                        messageElement.innerHTML = '<p>beyler</p>'; // mesajı değiştir
                    }
                }
            });
        });
    });

    // chat containerını incele
    const chatContainer = document.querySelector('.chat-message-container'); // mesaj seçici container edition
    if (chatContainer) {
        observer.observe(chatContainer.parentNode, { childList: true, subtree: true }); // yeni mesajları incele container edition
    }
})();