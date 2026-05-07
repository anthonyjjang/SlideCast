const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const progressContainer = document.getElementById('progress-container');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const resultContainer = document.getElementById('result-container');
const downloadBtn = document.getElementById('download-btn');

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

    uploadArea.classList.add('hidden');
    progressContainer.classList.remove('hidden');

    try {
        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        
        if (data.job_id) {
            currentJobId = data.job_id;
            connectWebSocket(data.job_id);
        }
    } catch (err) {
        alert('업로드 중 오류가 발생했습니다.');
        uploadArea.classList.remove('hidden');
        progressContainer.classList.add('hidden');
    }
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
            progressContainer.classList.add('hidden');
            resultContainer.classList.remove('hidden');
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
        }
    }, 2000);
}

downloadBtn.addEventListener('click', () => {
    if (currentJobId) {
        alert("영상 다운로드가 시작됩니다. (API 연동 예정)");
    }
});
