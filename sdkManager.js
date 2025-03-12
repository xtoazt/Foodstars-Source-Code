// POKI VERSION //
PokiSDK.init().then(() => {
    window.pokiSdkLoaded = true;
    console.log("Poki SDK successfully initialized");
    // fire your function to continue to game
}).catch(() => {
    console.log("Initialized, something went wrong, load you game anyway");
    // fire your function to continue to game
});
function showMid() {
    console.log("Showing Mid");
    // pause your game here if it isn't already
    try {
        PokiSDK.commercialBreak(() => {
            // you can pause any background music or other audio here
        }).then(() => {
            console.log("Commercial break finished, proceeding to game (success)");
            // if the audio was paused you can resume it here (keep in mind that the function above to pause it might not always get called)
            // continue your game here
            unityInstance.SendMessage('Ads', 'OnDaReveresedFinishedJS', 'Success');
        });
    } catch (error) {
        // Handle the case where PokiSDK is not defined
        console.error("midroll ad failed, Error:", error);
        unityInstance.SendMessage('Ads', 'OnDaReveresedFinishedJS', 'Failed');
    }
}
function showRe() {
    console.log("Showing Re");
    // pause your game here if it isn't already
    try {
        PokiSDK.rewardedBreak(() => {
            // you can pause any background music or other audio here
        }).then((success) => {
            var par = "";
            if (success) {
                // video was displayed, give reward
                par = 'Success';
            } else {
                // video not displayed, should not give reward
                par = 'Failed';
            }
            // if the audio was paused you can resume it here (keep in mind that the function above to pause it might not always get called)
            console.log("Rewarded break finished with " + par + ", proceeding to game");
            // continue your game here
            unityInstance.SendMessage('Ads', 'OnDaReveresedFinishedJS', par);
        });
    } catch (error) {
        // Handle the case where PokiSDK is not defined
        console.error("Error:", error);
        unityInstance.SendMessage('Ads', 'OnDaReveresedFinishedJS', 'Failed');
    }
}

function gameplayStart() {
    PokiSDK.gameplayStart();
    console.log("OK: gameplayStart was called on JS from unity");
}
function gameplayEnd() {
    PokiSDK.gameplayStop();
    console.log("OK: gameplayEnd was called on JS from unity");
}
