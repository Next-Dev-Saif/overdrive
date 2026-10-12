import numpy as np
import scipy.io.wavfile as wavfile
import os

def generate_explosion(filename):
    sample_rate = 44100
    duration = 1.5
    t = np.linspace(0, duration, int(sample_rate * duration))
    # Brown noise (integration of white noise)
    white = np.random.randn(len(t))
    brown = np.cumsum(white)
    # Normalize
    brown = brown / np.max(np.abs(brown))
    # Envelope: sharp attack, long decay
    envelope = np.exp(-t * 3)
    # Lowpass filter effect by smoothing
    brown = np.convolve(brown, np.ones(50)/50, mode='same')
    audio = brown * envelope
    # Convert to 16-bit PCM
    audio_int = np.int16(audio * 32767)
    wavfile.write(filename, sample_rate, audio_int)
    print(f"Generated {filename}")

def generate_minigun(filename):
    sample_rate = 44100
    duration = 0.1  # very short thud for a single bullet
    t = np.linspace(0, duration, int(sample_rate * duration))
    # Mix of noise and low pitch thump
    noise = np.random.randn(len(t)) * 0.5
    thump = np.sin(2 * np.pi * 100 * t) * np.exp(-t * 50)
    audio = (noise * np.exp(-t * 40)) + thump
    audio = audio / np.max(np.abs(audio))
    audio_int = np.int16(audio * 32767)
    wavfile.write(filename, sample_rate, audio_int)
    print(f"Generated {filename}")

def generate_ability(filename):
    sample_rate = 44100
    duration = 1.0
    t = np.linspace(0, duration, int(sample_rate * duration))
    # Frequency sweep up
    f0 = 200
    f1 = 800
    phase = 2 * np.pi * (f0 * t + (f1 - f0) / (2 * duration) * t**2)
    audio = np.sin(phase)
    # Envelope
    envelope = np.sin(np.pi * t / duration)
    audio = audio * envelope
    audio_int = np.int16(audio * 32767)
    wavfile.write(filename, sample_rate, audio_int)
    print(f"Generated {filename}")

def generate_bgm(filename):
    sample_rate = 44100
    duration = 4.0 # 4 second loop
    t = np.linspace(0, duration, int(sample_rate * duration))
    # Bassline (simple arpeggio)
    audio = np.zeros_like(t)
    notes = [40, 40, 43, 40, 45, 40, 47, 40] # synthwave style bass
    
    # Very simple synth pulse
    for i, n in enumerate(notes):
        start = int(i * 0.5 * sample_rate)
        end = int((i+1) * 0.5 * sample_rate)
        t_note = t[start:end]
        freq = 440 * (2 ** ((n - 69) / 12))
        pulse = np.sign(np.sin(2 * np.pi * freq * t_note)) * np.exp(-np.linspace(0, 0.5, len(t_note)) * 2)
        audio[start:end] += pulse

    # Kick drum
    for i in range(8):
        start = int(i * 0.5 * sample_rate)
        t_kick = np.linspace(0, 0.2, int(0.2 * sample_rate))
        kick = np.sin(2 * np.pi * 60 * t_kick - 10 * np.exp(-t_kick*20)) * np.exp(-t_kick*10)
        audio[start:start+len(kick)] += kick

    audio = audio / np.max(np.abs(audio)) * 0.5
    audio_int = np.int16(audio * 32767)
    wavfile.write(filename, sample_rate, audio_int)
    print(f"Generated {filename}")

os.makedirs('/Users/saifsapple/Documents/Work/overdrive/public/assets/audio/sfx/generated', exist_ok=True)
generate_explosion('/Users/saifsapple/Documents/Work/overdrive/public/assets/audio/sfx/generated/explosion.wav')
generate_minigun('/Users/saifsapple/Documents/Work/overdrive/public/assets/audio/sfx/generated/minigun.wav')
generate_ability('/Users/saifsapple/Documents/Work/overdrive/public/assets/audio/sfx/generated/ability.wav')
generate_bgm('/Users/saifsapple/Documents/Work/overdrive/public/assets/audio/sfx/generated/bgm.wav')
