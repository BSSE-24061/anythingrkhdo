// Utility for playing notification sounds
export const playNotificationSound = () => {
    try {
        // Create a simple beep using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Double beep for notification
        oscillator.frequency.value = 800; // Hz
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);

        // Second beep
        const oscillator2 = audioContext.createOscillator();
        oscillator2.connect(gainNode);

        oscillator2.frequency.value = 1000;
        oscillator2.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);

        oscillator2.start(audioContext.currentTime + 0.15);
        oscillator2.stop(audioContext.currentTime + 0.25);
    } catch (error) {
        console.log('Audio notification not available:', error);
    }
};
