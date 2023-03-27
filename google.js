// TODO: Set the below credentials
const CLIENT_ID = '911067435942-phmoaj6h02oqb6187ka8c5vcegdvag4g.apps.googleusercontent.com';
const API_KEY = 'YOUR_API_KEY';

// Discovery URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

// Set API access scope before proceeding authorization request
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
let tokenClient;
let gapiInited = false;
let gisInited = false;

// Check if access token exists in local storage
const accessToken = localStorage.getItem('access_token');
if (accessToken) {
  gapi.auth.setToken({access_token: accessToken});
}

/**
 * Callback after api.js is loaded.
 */
function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
  maybeEnableButtons();
}

/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // defined later
  });
  gisInited = true;
  maybeEnableButtons();
}

/**
 * Enables user interaction after all libraries are loaded.
 */
function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    document.getElementById('authorize_button').style.visibility = 'visible';
  }
}

/**
 *  Sign in the user upon button click.
 */
document.getElementById("signup").addEventListener("click",function(){
  handleAuthClick()
});

function handleAuthClick() {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw (resp);
    }
    document.getElementById('signup').style.visibility = 'hidden';
    localStorage.setItem('access_token', gapi.auth.getToken().access_token);
    await uploadFile();
  };

  if (gapi.auth.getToken() === null) {
    // Prompt the user to select a Google Account and ask for consent to share their data
    // when establishing a new session.
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    // Skip display of account chooser and consent dialog for an existing session.
    tokenClient.requestAccessToken({ prompt: '' });
  }
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick() {
  const token = gapi.auth.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.auth.setToken(null);
    localStorage.removeItem('access_token');
    document.getElementById('content').style.display = 'none';
    document.getElementById('content').innerHTML = '';
    document.getElementById('authorize_button').value = 'Authorize';
    document.getElementById('signout_button').style.visibility = 'hidden';
  }
}

/**
 * Upload file to Google Drive.
 */
export async function uploadFile(blob) {
  const file = new File([await blobToArrayBuffer(blob)], "video.mp4", { type: "video/mp4" });
  const metadata = {
    'name': 'sample-file-via-js', // Filename at Google Drive
    'mimeType': 'video/mp4', // mimeType at Google Drive
    // Note: remove this parameter, if no target is needed
		'parents': ['SET-GOOGLE-DRIVE-FOLDER-ID'], // Folder ID at Google Drive which is optional
	};

	var accessToken = gapi.auth.getToken().access_token; // Here gapi is used for retrieving the access token.
	var form = new FormData();
	form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
	form.append('file', file);

	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=xa298sd_sdlkj2');
	xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
	xhr.responseType = 'json';
	xhr.onload = () => {
		document.getElementById('content').innerHTML = "File uploaded successfully. The Google Drive file id is <b>" + xhr.response.id + "</b>";
		document.getElementById('content').style.display = 'block';
	};
	xhr.send(form);
}

