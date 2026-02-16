// Procedural sound generation for UI interactions
// Creates a pleasant "pop" sound using Web Audio API

let audioContext: AudioContext | null = null;

export const playClickSound = () => {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // "drip" or "pop" sound
        // Start at a higher frequency and drop quickly
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.15);

        // Envelope
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);

    } catch (e) {
        console.error("Audio play failed", e);
    }
}

export const playHoverSound = () => {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Very subtle high frequency blip
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);

        // Envelope
        gainNode.gain.setValueAtTime(0.02, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.05);

    } catch (e) {
        // Ignore
    }
}
