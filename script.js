{\rtf1\ansi\ansicpg1252\cocoartf2761
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx566\tx1133\tx1700\tx2267\tx2834\tx3401\tx3968\tx4535\tx5102\tx5669\tx6236\tx6803\pardirnatural\partightenfactor0

\f0\fs24 \cf0 document.addEventListener('DOMContentLoaded', () => \{\
    // Get DOM elements\
    const dropArea = document.getElementById('drop-area');\
    const fileInput = document.getElementById('file-input');\
    const loadingArea = document.getElementById('loading-area');\
    const resultArea = document.getElementById('result-area');\
    const fpsValue = document.getElementById('fps-value');\
    const resetButton = document.getElementById('reset-button');\
    const errorArea = document.getElementById('error-area');\
    const errorMessage = document.getElementById('error-message');\
    const errorResetButton = document.getElementById('error-reset-button');\
\
    // Add event listeners for the drag and drop functionality\
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => \{\
        dropArea.addEventListener(eventName, preventDefaults, false);\
    \});\
\
    function preventDefaults(e) \{\
        e.preventDefault();\
        e.stopPropagation();\
    \}\
\
    ['dragenter', 'dragover'].forEach(eventName => \{\
        dropArea.addEventListener(eventName, () => \{\
            dropArea.classList.add('drag-over');\
        \}, false);\
    \});\
\
    ['dragleave', 'drop'].forEach(eventName => \{\
        dropArea.addEventListener(eventName, () => \{\
            dropArea.classList.remove('drag-over');\
        \}, false);\
    \});\
\
    // Handle the drop event\
    dropArea.addEventListener('drop', handleDrop, false);\
    \
    // Handle click on drop area\
    dropArea.addEventListener('click', () => \{\
        fileInput.click();\
    \});\
    \
    // Handle file selection via input\
    fileInput.addEventListener('change', handleFileSelect, false);\
    \
    // Handle reset buttons\
    resetButton.addEventListener('click', resetApp);\
    errorResetButton.addEventListener('click', resetApp);\
\
    // Function to handle dropped files\
    function handleDrop(e) \{\
        const dt = e.dataTransfer;\
        const files = dt.files;\
        \
        if (files.length > 0) \{\
            processVideoFile(files[0]);\
        \}\
    \}\
    \
    // Function to handle file selection via input\
    function handleFileSelect(e) \{\
        const files = e.target.files;\
        \
        if (files.length > 0) \{\
            processVideoFile(files[0]);\
        \}\
    \}\
\
    // Process the video file to determine FPS\
    function processVideoFile(file) \{\
        // Check if file is a video\
        if (!file.type.startsWith('video/')) \{\
            showError('Please select a valid video file.');\
            return;\
        \}\
\
        // Show loading indicator and hide other areas\
        dropArea.classList.add('hidden');\
        loadingArea.classList.remove('hidden');\
        resultArea.classList.add('hidden');\
        errorArea.classList.add('hidden');\
\
        // Create a URL for the file\
        const videoURL = URL.createObjectURL(file);\
        \
        // Create a video element to analyze the file\
        const video = document.createElement('video');\
        video.style.display = 'none';\
        document.body.appendChild(video);\
        \
        // Set up event listeners for the video\
        video.addEventListener('loadedmetadata', () => \{\
            // Try to determine FPS\
            determineFPS(video)\
                .then(fps => \{\
                    // Display the result\
                    fpsValue.textContent = fps.toFixed(2);\
                    loadingArea.classList.add('hidden');\
                    resultArea.classList.remove('hidden');\
                \})\
                .catch(error => \{\
                    console.error('Error determining FPS:', error);\
                    showError('Could not determine the frame rate of this video. Please try a different file.');\
                \})\
                .finally(() => \{\
                    // Clean up resources\
                    URL.revokeObjectURL(videoURL);\
                    document.body.removeChild(video);\
                \});\
        \});\
        \
        video.addEventListener('error', () => \{\
            // Handle video loading error\
            URL.revokeObjectURL(videoURL);\
            document.body.removeChild(video);\
            showError('Failed to load the video. Please try a different file.');\
        \});\
        \
        // Set the video source and load it\
        video.src = videoURL;\
        video.load();\
    \}\
\
    // Function to determine FPS using different methods with fallbacks\
    async function determineFPS(videoElement) \{\
        // Method 1: Using requestVideoFrameCallback (modern browsers)\
        if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) \{\
            return await getFPSWithRequestVideoFrameCallback(videoElement);\
        \}\
        \
        // Method 2: Capturing frames at small time intervals\
        return await getFPSWithFrameCapture(videoElement);\
    \}\
\
    // Determine FPS using requestVideoFrameCallback API\
    function getFPSWithRequestVideoFrameCallback(videoElement) \{\
        return new Promise((resolve, reject) => \{\
            const frameTimestamps = [];\
            const maxFrames = 30; // Number of frames to analyze\
            \
            videoElement.play().catch(error => \{\
                // Some browsers require user interaction for play()\
                // We'll fall back to the second method if play fails\
                reject(error);\
            \});\
\
            function frameCallback(now, metadata) \{\
                frameTimestamps.push(metadata.presentationTime || now);\
                \
                if (frameTimestamps.length < maxFrames) \{\
                    videoElement.requestVideoFrameCallback(frameCallback);\
                \} else \{\
                    videoElement.pause();\
                    \
                    // Calculate average time between frames\
                    let totalDelta = 0;\
                    for (let i = 1; i < frameTimestamps.length; i++) \{\
                        totalDelta += frameTimestamps[i] - frameTimestamps[i-1];\
                    \}\
                    \
                    const avgDelta = totalDelta / (frameTimestamps.length - 1);\
                    const fps = 1000 / avgDelta;\
                    \
                    resolve(fps);\
                \}\
            \}\
            \
            videoElement.requestVideoFrameCallback(frameCallback);\
        \});\
    \}\
\
    // Determine FPS by capturing frames at small time intervals\
    function getFPSWithFrameCapture(videoElement) \{\
        return new Promise((resolve, reject) => \{\
            // Create a canvas to capture frames\
            const canvas = document.createElement('canvas');\
            const ctx = canvas.getContext('2d');\
            \
            // Set canvas size to match video dimensions\
            videoElement.addEventListener('loadedmetadata', () => \{\
                canvas.width = videoElement.videoWidth;\
                canvas.height = videoElement.videoHeight;\
            \});\
            \
            const frames = [];\
            const maxFrames = 60; // Maximum number of frames to analyze\
            const interval = 10; // Check every 10ms\
            \
            // Start playing the video\
            videoElement.play().catch(error => \{\
                // If autoplay is blocked or there's another issue\
                reject(error);\
            \});\
            \
            // Track unique frames\
            let lastFrameHash = null;\
            let frameCount = 0;\
            let startTime = null;\
            \
            const captureFrame = () => \{\
                if (!startTime) startTime = performance.now();\
                \
                // Draw the current video frame to the canvas\
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);\
                \
                // Get frame data\
                const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);\
                \
                // Create a simple hash of the frame (sampling some pixels)\
                const sampleSize = 1000;\
                const step = Math.max(1, Math.floor(frameData.data.length / 4 / sampleSize));\
                let hash = '';\
                \
                for (let i = 0; i < frameData.data.length; i += step * 4) \{\
                    hash += frameData.data[i] + frameData.data[i+1] + frameData.data[i+2];\
                    if (hash.length > 100) break; // Limit hash size\
                \}\
                \
                // If this frame is different from the last one, count it\
                if (hash !== lastFrameHash) \{\
                    frameCount++;\
                    lastFrameHash = hash;\
                \}\
                \
                // Continue capturing frames\
                if (frameCount < maxFrames && videoElement.currentTime < videoElement.duration) \{\
                    setTimeout(captureFrame, interval);\
                \} else \{\
                    // Calculate FPS\
                    const endTime = performance.now();\
                    const elapsedSeconds = (endTime - startTime) / 1000;\
                    const fps = frameCount / elapsedSeconds;\
                    \
                    // Pause video and resolve promise\
                    videoElement.pause();\
                    resolve(fps);\
                \}\
            \};\
            \
            // Start capturing frames once video can play\
            videoElement.addEventListener('canplay', captureFrame);\
        \});\
    \}\
\
    // Function to show error message\
    function showError(message) \{\
        errorMessage.textContent = message;\
        dropArea.classList.add('hidden');\
        loadingArea.classList.add('hidden');\
        resultArea.classList.add('hidden');\
        errorArea.classList.remove('hidden');\
    \}\
\
    // Function to reset the application\
    function resetApp() \{\
        // Clear file input\
        fileInput.value = '';\
        \
        // Hide result and error areas, show drop area\
        dropArea.classList.remove('hidden');\
        loadingArea.classList.add('hidden');\
        resultArea.classList.add('hidden');\
        errorArea.classList.add('hidden');\
    \}\
\});}