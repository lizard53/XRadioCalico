let hls = null;
let audio = null;
let isPlaying = false;
let startTime = 0;
let elapsedInterval = null;
let metadataInterval = null;
let currentSongKey = '';
let userId = localStorage.getItem('radioUserId') || generateUserId();
const streamUrl = 'https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8';
const metadataUrl = 'https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json';

function generateUserId() {
    const id = 'user_' + Math.random().toString(36).substr(2, 9) + Date.now();
    localStorage.setItem('radioUserId', id);
    return id;
}

function togglePlayPause() {
    if (isPlaying) {
        pauseRadio();
    } else {
        playRadio();
    }
}

function playRadio() {
    if (!audio) {
        audio = document.createElement('audio');
        audio.volume = document.getElementById('volume').value / 100;

        if (Hls.isSupported()) {
            hls = new Hls({ enableWorker: true, lowLatencyMode: true });
            hls.loadSource(streamUrl);
            hls.attachMedia(audio);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                audio.play().catch(err => updateStatus('Error: ' + err.message));
            });
            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                    updateStatus('Stream error: ' + data.type);
                }
            });
        } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
            audio.src = streamUrl;
            audio.play().catch(err => updateStatus('Error: ' + err.message));
        } else {
            updateStatus('HLS not supported in this browser');
            return;
        }
    } else {
        audio.play().catch(err => updateStatus('Error: ' + err.message));
    }

    isPlaying = true;
    startTime = Date.now();
    startElapsedTimer();
    startMetadataUpdates();
    document.getElementById('playBtn').innerHTML = '⏸';
    fetchMetadata();
}

function pauseRadio() {
    if (audio) {
        audio.pause();
    }
    isPlaying = false;
    stopElapsedTimer();
    stopMetadataUpdates();
    document.getElementById('playBtn').innerHTML = '▶';
}

function startElapsedTimer() {
    if (elapsedInterval) return;
    elapsedInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        document.getElementById('elapsedTime').textContent = formatTime(elapsed);
    }, 1000);
}

function stopElapsedTimer() {
    if (elapsedInterval) {
        clearInterval(elapsedInterval);
        elapsedInterval = null;
    }
}

function changeVolume(value) {
    document.getElementById('volumeValue').textContent = value;
    if (audio) {
        audio.volume = value / 100;
    }
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
        return `${hours}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

async function fetchMetadata() {
    try {
        const response = await fetch(metadataUrl);
        const data = await response.json();

        document.getElementById('track-artist').textContent = data.artist || 'Unknown Artist';
        document.getElementById('track-title').textContent = data.title || 'Unknown Title';
        document.getElementById('track-album').textContent = data.album || '';
        document.getElementById('year-badge').textContent = data.date || '';

        const albumArt = document.getElementById('album-art');
        albumArt.src = 'https://d3d4yli4hf5bmh.cloudfront.net/cover.jpg?t=' + Date.now();

        currentSongKey = `${data.artist || 'unknown'}_${data.title || 'unknown'}`.replace(/[^a-zA-Z0-9]/g, '_');
        await fetchRatings();

        updateRecentTracks(data);
    } catch (err) {
        console.error('Error fetching metadata:', err);
    }
}

function updateRecentTracks(data) {
    const recentContainer = document.getElementById('recent-tracks');
    recentContainer.innerHTML = '';

    for (let i = 1; i <= 5; i++) {
        const artist = data[`prev_artist_${i}`];
        const title = data[`prev_title_${i}`];

        if (artist && title) {
            const trackDiv = document.createElement('div');
            trackDiv.className = 'recent-track';
            trackDiv.innerHTML = `<span class="track-artist">${artist}:</span> <span class="track-title">${title}</span>`;
            recentContainer.appendChild(trackDiv);
        }
    }
}

function startMetadataUpdates() {
    if (metadataInterval) return;
    metadataInterval = setInterval(fetchMetadata, 10000);
}

function stopMetadataUpdates() {
    if (metadataInterval) {
        clearInterval(metadataInterval);
        metadataInterval = null;
    }
}

async function fetchRatings() {
    try {
        const response = await fetch(`/ratings/${currentSongKey}`);
        const data = await response.json();
        document.getElementById('thumbs-up-count').textContent = data.thumbsUp;
        document.getElementById('thumbs-down-count').textContent = data.thumbsDown;
    } catch (err) {
        console.error('Error fetching ratings:', err);
    }
}

async function rateSong(rating) {
    if (!currentSongKey) {
        console.log('No song loaded yet');
        return;
    }

    try {
        const response = await fetch('/ratings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ songKey: currentSongKey, userId, rating })
        });

        if (response.ok) {
            await fetchRatings();
            const btn = rating === 1 ? 'thumbs-up' : 'thumbs-down';
            const btnElement = document.getElementById(btn);
            if (btnElement) {
                btnElement.classList.add('rated');
                setTimeout(() => {
                    btnElement.classList.remove('rated');
                }, 1000);
            }
        }
    } catch (err) {
        console.error('Error submitting rating:', err);
    }
}