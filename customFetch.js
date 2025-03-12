(function () {

    function clamp(num, min, max) {
        return num <= min
            ? min
            : num >= max
                ? max
                : num
    }

    // Store the original fetch function
    const originalFetch = window.fetch;

    // Function to handle fetch with retries
    async function fetchWithRetries(resource, init, retries = 1) {
        try {
            const response = await originalFetch(resource, init);
            if (!response.ok) throw new Error(`Failed to fetch ${resource}: ${response.statusText}`);
            return response;
        } catch (error) {
            console.error(`Attempt to fetch ${resource} failed:`, error);
            if (retries > 0) {
                console.log(`Retrying... Attempts left: ${retries}`);
                return fetchWithRetries(resource, init, retries - 1);
            } else {
                throw error;
            }
        }
    }

    // Function to handle fetch progress for .wasm files
    function handleProgress(response, resource, resolve, reject) {
        //const contentLength = response.headers.get('Content-Length');
        //var isWasm = resource.endsWith('.wasm.br') || resource.endsWith('.wasm');
        //const total = isWasm ? 33964861 : 20027602;
        const total = 28_527_601;
        let loaded = 0;
        let totalFrames = 0;
        const reader = response.body.getReader();
        const stream = new ReadableStream({
            start(controller) {
                function read() {
                    reader.read().then(({ done, value }) => {
                        if (done) {
                            controller.close();
                            return;
                        }
                        if (!initialAliveMessage) {
                            initialAliveMessage = true;
                            const spinner = document.querySelector('.spinner');
                            spinner.style.display = "none";
                        }
                        loaded += value.byteLength;
                        totalFrames++;
                        if (totalFrames % 2 === 0)
                            OnFetchProgress(resource, loaded, total);
                        controller.enqueue(value);
                        read();
                    }).catch(error => {
                        console.error('Error reading fetch response:', error);
                        controller.error(error);
                        reject(error);
                    });
                }
                read();
            }
        });

        return new Response(stream, {
            headers: response.headers  // Preserve original headers
        });
    }
    function easeOutQuadPercentage(percent) {
        var t = percent / 100;
        //return (1 - (1 - t) * (1 - t)) * 100.0;
        return (1 - Math.pow(1 - t, 3)) * 100.0;
    }
    // Function to handle fetch progress event
    var downloadOfFirstFileEnded = false;
    var initialAliveMessage = false;
    function OnFetchProgress(filename, loaded, total) {
        //console.log(loaded);
        loaded = clamp(loaded, 0, total);
        var isFirstFile = !(filename.endsWith('.wasm.br') || filename.endsWith('.wasm'));
        var percent = clamp(easeOutQuadPercentage(loaded / total * 100), 0, 100);
        loaded = percent * total; // adjust the fake loaded accordingly
        if (!isFirstFile && !downloadOfFirstFileEnded)
            return;
        //var filePart = isFirstFile ? "2" : "1"; // Determine the file part based on the filename extension
        var loadingTxt = document.querySelector("#loadingTxt");
        if (loadingTxt) loadingTxt.innerHTML = `Downloading Game Files ${percent.toFixed(2)}%`;
        var loadingTxtMinimal = document.querySelector("#loadingTxtMinimal");
        var fastLoadingAnim = document.querySelector("#unity-loading-bar-fast");
        if (loadingTxtMinimal) {
            var formattedLoaded = loaded.toLocaleString();
            var formattedTotal = total.toLocaleString();
            loadingTxtMinimal.innerHTML = `${(percent >= 99 ? "Almost There! (Decompressing...)" : `Loaded ${formattedLoaded}/${formattedTotal} bytes`)}`;
            var progressBarEmpty = document.querySelector("#unity-progress-bar-empty");
            var progressBarFull = document.querySelector("#unity-progress-bar-full");
            if (percent < 99) {
                progressBarEmpty.style.display = "";
                progressBarFull.style.width = `${percent}%`;
                progressBarFull.style.display = "block";
                fastLoadingAnim.style.display = "none";
            }
            else {
                var progressBarFast = document.querySelector("#unity-loading-bar-fast");
                progressBarFast.style.display = "block";
                progressBarEmpty.style.display = "none";
                progressBarFull.style.display = "none";
            }
        }
    }

    // Override the fetch function
    window.fetch = function (resource, init) {
        if (resource.endsWith('.br') || resource.endsWith('.wasm') || resource.endsWith('.data')) {  // Assuming .br is only used with wasm files
            return new Promise((resolve, reject) => {
                fetchWithRetries(resource, init).then(response => {
                    resolve(handleProgress(response, resource, resolve, reject));
                }).catch(error => {
                    console.error(`Error fetching ${resource}:`, error);
                    reject(error);
                });
            });
        } else {
            // Use the original fetch for non-.wasm files
            return originalFetch(resource, init);
        }
    };
})();
