const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const progressContainer = document.getElementById('progress-container');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const resultContainer = document.getElementById('result-container');
const downloadBtn = document.getElementById('download-btn');
const settingsArea = document.getElementById('settings-area');
const voiceSelect = document.getElementById('voice-select');
const delayInput = document.getElementById('delay-input');

let currentJobId = null;

uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleUpload(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleUpload(e.target.files[0]);
    }
});

async function handleUpload(file) {
    if (!file.name.endsWith('.pptx')) {
        alert('PPTX 파일만 업로드할 수 있습니다.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('voice_key', voiceSelect.value);
    formData.append('delay_sec', delayInput.value);

    uploadArea.classList.add('hidden');
    settingsArea.classList.add('hidden');
    progressContainer.classList.remove('hidden');

    try {
        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (!res.ok) {
            resetToUpload(data.detail || '업로드가 거부되었습니다.');
            return;
        }

        if (data.job_id) {
            currentJobId = data.job_id;
            connectWebSocket(data.job_id);
        }
    } catch (err) {
        resetToUpload('업로드 중 오류가 발생했습니다.');
    }
}

// 오류 발생 시 업로드 화면으로 되돌린다
function resetToUpload(message) {
    progressContainer.classList.add('hidden');
    resultContainer.classList.add('hidden');
    uploadArea.classList.remove('hidden');
    settingsArea.classList.remove('hidden');
    fileInput.value = '';
    if (message) alert(message);
}

function connectWebSocket(jobId) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/${jobId}`);
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        progressFill.style.width = `${data.progress}%`;
        progressText.innerText = data.message;
        
        if (data.progress >= 100) {
            ws.close();
        }
    };
    
    // Fallback polling
    const pollInterval = setInterval(async () => {
        const res = await fetch(`/api/jobs/${jobId}`);
        const statusData = await res.json();
        
        if (statusData.status === 'SUCCESS') {
            clearInterval(pollInterval);
            progressContainer.classList.add('hidden');
            resultContainer.classList.remove('hidden');
        } else if (statusData.status === 'PROGRESS') {
            progressFill.style.width = `${statusData.progress}%`;
            progressText.innerText = statusData.message;
        } else if (statusData.status === 'FAILURE') {
            clearInterval(pollInterval);
            resetToUpload("영상 생성에 실패했습니다:\n" + (statusData.error || "알 수 없는 오류"));
        }
    }, 2000);
}

downloadBtn.addEventListener('click', () => {
    if (currentJobId) {
        window.location.href = `/api/download/${currentJobId}`;
    }
});
