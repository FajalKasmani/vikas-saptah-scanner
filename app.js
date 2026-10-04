/************************************************
 * VIKAS SAPTAH '26
 * QR SCANNER + GOOGLE SHEET BACKEND
 ************************************************/


/*
 * ==============================================
 * IMPORTANT
 * ==============================================
 *
 * Paste your Google Apps Script Web App URL here.
 *
 * Example:
 *
 * https://script.google.com/macros/s/XXXXXXXX/exec
 *
 */

const API_URL =
  "https://script.google.com/macros/s/AKfycbxrdxRVTELEvcbTa-5FONwyzLcToyfRJZYBpWk5fqsHYPxPSd0BBY2lTTw3rkMN4TXU/exec";


/*
 * ==============================================
 * GLOBAL VARIABLES
 * ==============================================
 */

let qrScanner = null;

let scannerRunning = false;

let lastScannedId = "";

let lastScanTime = 0;


/*
 * ==============================================
 * PAGE LOAD
 * ==============================================
 */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    console.log(
      "VIKAS SAPTAH APP.JS LOADED"
    );


    /*
     * Button listeners
     */

    document
      .getElementById(
        "startScannerBtn"
      )
      .addEventListener(
        "click",
        startScanner
      );


    document
      .getElementById(
        "stopScannerBtn"
      )
      .addEventListener(
        "click",
        stopScanner
      );


    document
      .getElementById(
        "findBtn"
      )
      .addEventListener(
        "click",
        findAttendee
      );


    /*
     * Enter key
     */

    document
      .getElementById(
        "registrationId"
      )
      .addEventListener(
        "keydown",
        function (event) {

          if (
            event.key === "Enter"
          ) {

            findAttendee();

          }

        }
      );


    /*
     * Check API URL
     */

    if (
      API_URL.includes(
        "PASTE_YOUR"
      )
    ) {

      showCameraMessage(
        "⚠️ Apps Script API URL is not configured yet.",
        "warning"
      );

    }

  }
);


/*
 * ==============================================
 * START QR SCANNER
 * ==============================================
 */

async function startScanner() {


  console.log(
    "START SCANNER CLICKED"
  );


  const status =
    document.getElementById(
      "scannerStatus"
    );


  if (
    typeof Html5Qrcode ===
    "undefined"
  ) {

    showCameraMessage(

      "❌ QR scanner library could not load. Please refresh the page.",

      "error"

    );

    return;

  }


  if (
    scannerRunning
  ) {

    return;

  }


  status.innerText =
    "Requesting camera permission...";


  try {


    /*
     * Create scanner
     */

    if (!qrScanner) {

      qrScanner =
        new Html5Qrcode(
          "reader"
        );

    }


    /*
     * Try back camera
     */

    await qrScanner.start(

      {
        facingMode: "environment"
      },


      {
        fps: 10,

        qrbox: {
          width: 280,
          height: 280
        },

        aspectRatio: 1.0

      },


      onScanSuccess,

      onScanFailure

    );


    scannerStarted();


  }


  catch (error) {


    console.log(
      "Primary camera error:",
      error
    );


    /*
     * Fallback:
     * find available cameras
     */

    try {


      const cameras =
        await Html5Qrcode
          .getCameras();


      if (
        !cameras ||
        cameras.length === 0
      ) {

        throw new Error(
          "No camera found."
        );

      }


      /*
       * Prefer rear camera
       */

      let selectedCamera =
        cameras.find(
          function (camera) {

            const label =
              String(
                camera.label || ""
              ).toLowerCase();


            return (

              label.includes(
                "back"
              ) ||

              label.includes(
                "rear"
              ) ||

              label.includes(
                "environment"
              )

            );

          }
        );


      /*
       * Otherwise first camera
       */

      if (
        !selectedCamera
      ) {

        selectedCamera =
          cameras[0];

      }


      await qrScanner.start(

        selectedCamera.id,


        {
          fps: 10,

          qrbox: {
            width: 280,
            height: 280
          },

          aspectRatio: 1.0

        },


        onScanSuccess,

        onScanFailure

      );


      scannerStarted();


    }


    catch (finalError) {


      console.error(
        "Camera failed:",
        finalError
      );


      status.innerText =
        "❌ Camera could not start";


      showCameraMessage(

        "❌ Camera could not start.<br><br>" +

        "Please check browser camera permission and make sure you opened this site using HTTPS.",

        "error"

      );

    }

  }

}


/*
 * ==============================================
 * SCANNER STARTED
 * ==============================================
 */

function scannerStarted() {


  scannerRunning =
    true;


  document
    .getElementById(
      "startScannerBtn"
    )
    .classList
    .add(
      "hidden"
    );


  document
    .getElementById(
      "stopScannerBtn"
    )
    .classList
    .remove(
      "hidden"
    );


  document
    .getElementById(
      "scannerStatus"
    )
    .innerText =
    "📷 Camera active — point at QR";


  clearCameraMessage();

}


/*
 * ==============================================
 * QR SUCCESS
 * ==============================================
 */

async function onScanSuccess(
  decodedText
) {


  console.log(
    "QR SCANNED:",
    decodedText
  );


  const now =
    Date.now();


  /*
   * Prevent duplicate scan
   */

  if (

    decodedText ===
    lastScannedId &&

    now - lastScanTime <
    3000

  ) {

    return;

  }


  lastScannedId =
    decodedText;


  lastScanTime =
    now;


  /*
   * Normalize QR text
   */

  let registrationId =
    String(
      decodedText
    )
    .trim()
    .toUpperCase();


  /*
   * Extract VS26-0001
   */

  const match =
    registrationId.match(
      /VS26-\d+/i
    );


  if (
    match
  ) {

    registrationId =
      match[0]
        .toUpperCase();

  }


  /*
   * Fill input
   */

  document
    .getElementById(
      "registrationId"
    )
    .value =
    registrationId;


  /*
   * Stop camera
   */

  await stopScanner();


  document
    .getElementById(
      "scannerStatus"
    )
    .innerText =
    "✅ QR scanned: " +
    registrationId;


  /*
   * Find attendee
   */

  findAttendee();

}


/*
 * ==============================================
 * QR FAILURE
 * ==============================================
 */

function onScanFailure(
  error
) {

  /*
   * Don't display anything.
   *
   * This function is called repeatedly
   * while searching for a QR.
   */

}


/*
 * ==============================================
 * STOP SCANNER
 * ==============================================
 */

async function stopScanner() {


  if (
    !qrScanner
  ) {

    return;

  }


  try {


    if (
      scannerRunning
    ) {

      await qrScanner.stop();

    }


  }

  catch (error) {

    console.log(
      "Scanner stop:",
      error
    );

  }


  scannerRunning =
    false;


  document
    .getElementById(
      "startScannerBtn"
    )
    .classList
    .remove(
      "hidden"
    );


  document
    .getElementById(
      "stopScannerBtn"
    )
    .classList
    .add(
      "hidden"
    );


  document
    .getElementById(
      "scannerStatus"
    )
    .innerText =
    "Scanner stopped";

}


/*
 * ==============================================
 * FIND ATTENDEE
 * ==============================================
 */

function findAttendee() {


  console.log(
    "FIND BUTTON CLICKED"
  );


  const input =
    document.getElementById(
      "registrationId"
    );


  const id =
    input
      .value
      .trim()
      .toUpperCase();


  if (
    !id
  ) {

    showError(
      "Please scan a QR code or enter Registration ID."
    );

    return;

  }


  /*
   * Validate ID
   */

  if (
    !/^VS26-\d+$/i.test(
      id
    )
  ) {

    showError(
      "Invalid Registration ID. Example: VS26-0001"
    );

    return;

  }


  showLoading();


  apiCall(

    "find",

    {
      id: id
    },


    function (response) {


      console.log(
        "FIND RESPONSE:",
        response
      );


      if (
        !response ||
        !response.success
      ) {

        showError(

          response &&
          response.message

            ? response.message

            : "Registration not found."

        );

        return;

      }


      renderAttendee(
        response.data
      );

    }

  );

}


/*
 * ==============================================
 * CHECK IN
 * ==============================================
 */

function checkIn(
  id
) {


  const input =
    document.getElementById(
      "certificateName"
    );


  const certificateName =
    input
      ? input.value.trim()
      : "";


  if (
    !certificateName
  ) {

    showError(
      "Certificate Name is required."
    );

    return;

  }


  showLoading();


  apiCall(

    "checkin",

    {

      id:
        id,

      certificateName:
        certificateName

    },


    function (response) {


      console.log(
        "CHECK-IN RESPONSE:",
        response
      );


      if (
        !response ||
        !response.success
      ) {


        /*
         * Duplicate check-in
         */

        if (
          response &&
          response.alreadyCheckedIn
        ) {


          renderAttendee(
            response.data
          );


          showWarning(

            "⚠️ Already Checked In at " +

            response.data.checkInTime

          );


          return;

        }


        showError(

          response &&
          response.message

            ? response.message

            : "Check-in failed."

        );


        return;

      }


      renderAttendee(
        response.data
      );


      showSuccess(
        "✅ Check-in completed successfully."
      );

    }

  );

}


/*
 * ==============================================
 * GOODIE
 * ==============================================
 */

function collectGoodie(
  id
) {


  showLoading();


  apiCall(

    "goodie",

    {
      id: id
    },


    function (response) {


      console.log(
        "GOODIE RESPONSE:",
        response
      );


      if (
        !response ||
        !response.success
      ) {


        /*
         * Duplicate goodie
         */

        if (
          response &&
          response.alreadyCollected
        ) {


          renderAttendee(
            response.data
          );


          showWarning(

            "⚠️ Goodie already collected at " +

            response.data.goodieTime

          );


          return;

        }


        showError(

          response &&
          response.message

            ? response.message

            : "Goodie collection failed."

        );


        return;

      }


      renderAttendee(
        response.data
      );


      showSuccess(
        "🎁 Goodie collected successfully."
      );

    }

  );

}


/*
 * ==============================================
 * API CALL
 * ==============================================
 *
 * Uses JSONP so the browser does not block
 * the Apps Script request because of CORS.
 *
 */

function apiCall(
  action,
  params,
  callback
) {


  /*
   * Check URL
   */

  if (
    !API_URL ||
    API_URL.includes(
      "PASTE_YOUR"
    )
  ) {

    showError(
      "Apps Script API URL is not configured in app.js."
    );

    return;

  }


  const callbackName =
    "vs26Callback_" +
    Date.now() +
    "_" +
    Math.floor(
      Math.random() * 100000
    );


  const script =
    document.createElement(
      "script"
    );


  /*
   * Global callback
   */

  window[callbackName] =
    function (response) {


      console.log(
        "API RESPONSE:",
        response
      );


      try {

        callback(
          response
        );

      }

      finally {


        delete window[
          callbackName
        ];


        if (
          script.parentNode
        ) {

          script.parentNode
            .removeChild(
              script
            );

        }

      }

    };


  /*
   * Build URL
   */

  const query =
    new URLSearchParams();


  query.append(
    "api",
    action
  );


  query.append(
    "callback",
    callbackName
  );


  Object.keys(
    params || {}
  ).forEach(
    function (key) {

      query.append(
        key,
        params[key]
      );

    }
  );


  script.src =
    API_URL +
    "?" +
    query.toString();


  /*
   * Error
   */

  script.onerror =
    function () {


      console.error(
        "API request failed"
      );


      delete window[
        callbackName
      ];


      if (
        script.parentNode
      ) {

        script.parentNode
          .removeChild(
            script
          );

      }


      showError(
        "Unable to connect to Google Apps Script."
      );

    };


  document
    .body
    .appendChild(
      script
    );

}


/*
 * ==============================================
 * RENDER ATTENDEE
 * ==============================================
 */

function renderAttendee(
  data
) {


  const card =
    document.getElementById(
      "resultCard"
    );


  const result =
    document.getElementById(
      "result"
    );


  card.classList.remove(
    "hidden"
  );


  let html = "";


  /*
   * Basic details
   */

  html +=
    '<div class="attendee">';


  html +=

    '<div class="attendee-name">' +

    escapeHtml(
      data.name || "-"
    ) +

    '</div>';


  html +=

    '<div class="registration-id">' +

    escapeHtml(
      data.registrationId || "-"
    ) +

    '</div>';


  html +=

    '<div class="info">' +

    '<b>Email:</b> ' +

    escapeHtml(
      data.email || "-"
    ) +

    '</div>';


  html +=

    '<div class="info">' +

    '<b>Mobile:</b> ' +

    escapeHtml(
      data.mobile || "-"
    ) +

    '</div>';


  html +=

    '<div class="info">' +

    '<b>Organization:</b> ' +

    escapeHtml(
      data.organization || "-"
    ) +

    '</div>';


  html +=

    '<div class="info">' +

    '<b>Attendance Type:</b> ' +

    escapeHtml(
      data.attendanceType || "-"
    ) +

    '</div>';


  /*
   * ============================================
   * CHECK-IN PENDING
   * ============================================
   */

  if (
    data.checkInStatus !==
    "Checked In"
  ) {


    html +=

      '<div class="status status-pending">' +

      '🟡 CHECK-IN PENDING' +

      '</div>';


    html +=

      '<label for="certificateName">' +

      'Certificate Name' +

      '</label>';


    html +=

      '<input ' +

      'id="certificateName" ' +

      'type="text" ' +

      'value="' +

      escapeAttribute(

        data.certificateName ||

        data.name ||

        ""

      ) +

      '">';


    html +=

      '<button ' +

      'id="checkInBtn" ' +

      'class="btn btn-success">' +

      '✅ CHECK IN' +

      '</button>';


  }


  /*
   * ============================================
   * CHECKED IN / GOODIE PENDING
   * ============================================
   */

  else if (
    data.goodieStatus !==
    "Collected"
  ) {


    html +=

      '<div class="status status-checked">' +

      '🟢 ALREADY CHECKED IN' +

      '<br><br>' +

      '<span class="small">' +

      'Check-in Time: ' +

      escapeHtml(
        data.checkInTime || "-"
      ) +

      '</span>' +

      '</div>';


    html +=

      '<label>' +

      'Certificate Name' +

      '</label>';


    html +=

      '<input ' +

      'type="text" ' +

      'value="' +

      escapeAttribute(

        data.certificateName ||

        data.name ||

        ""

      ) +

      '" readonly>';


    html +=

      '<div class="status status-pending">' +

      '🎁 GOODIE PENDING' +

      '</div>';


    html +=

      '<button ' +

      'id="goodieBtn" ' +

      'class="btn btn-warning">' +

      '🎁 COLLECT GOODIE' +

      '</button>';

  }


  /*
   * ============================================
   * FULLY COMPLETED
   * ============================================
   */

  else {


    html +=

      '<div class="status status-completed">' +

      '🔵 FULLY COMPLETED' +

      '</div>';


    html +=

      '<div class="message message-success">' +

      '<b>Check-in:</b><br>' +

      escapeHtml(
        data.checkInTime || "-"
      ) +

      '<br><br>' +

      '<b>Goodie Collected:</b><br>' +

      escapeHtml(
        data.goodieTime || "-"
      ) +

      '</div>';


    html +=

      '<div class="info">' +

      '<b>Certificate Name:</b><br>' +

      escapeHtml(

        data.certificateName ||

        data.name ||

        "-"

      ) +

      '</div>';


    html +=

      '<div class="message message-warning">' +

      '⚠️ NO ACTION REQUIRED' +

      '</div>';

  }


  html +=
    '</div>';


  result.innerHTML =
    html;


  /*
   * Attach CHECK-IN button
   */

  const checkInBtn =
    document.getElementById(
      "checkInBtn"
    );


  if (
    checkInBtn
  ) {

    checkInBtn.addEventListener(
      "click",
      function () {

        checkIn(
          data.registrationId
        );

      }
    );

  }


  /*
   * Attach GOODIE button
   */

  const goodieBtn =
    document.getElementById(
      "goodieBtn"
    );


  if (
    goodieBtn
  ) {

    goodieBtn.addEventListener(
      "click",
      function () {

        collectGoodie(
          data.registrationId
        );

      }
    );

  }

}


/*
 * ==============================================
 * LOADING
 * ==============================================
 */

function showLoading() {


  document
    .getElementById(
      "resultCard"
    )
    .classList
    .remove(
      "hidden"
    );


  document
    .getElementById(
      "result"
    )
    .innerHTML =

    '<div class="message message-info">' +

    '⏳ Processing...' +

    '</div>';

}


/*
 * ==============================================
 * SUCCESS
 * ==============================================
 */

function showSuccess(
  message
) {


  document
    .getElementById(
      "resultCard"
    )
    .classList
    .remove(
      "hidden"
    );


  document
    .getElementById(
      "result"
    )
    .insertAdjacentHTML(

      "afterbegin",

      '<div class="message message-success">' +

      escapeHtml(
        message
      ) +

      '</div>'

    );

}


/*
 * ==============================================
 * WARNING
 * ==============================================
 */

function showWarning(
  message
) {


  document
    .getElementById(
      "resultCard"
    )
    .classList
    .remove(
      "hidden"
    );


  document
    .getElementById(
      "result"
    )
    .insertAdjacentHTML(

      "afterbegin",

      '<div class="message message-warning">' +

      escapeHtml(
        message
      ) +

      '</div>'

    );

}


/*
 * ==============================================
 * ERROR
 * ==============================================
 */

function showError(
  message
) {


  document
    .getElementById(
      "resultCard"
    )
    .classList
    .remove(
      "hidden"
    );


  document
    .getElementById(
      "result"
    )
    .innerHTML =

    '<div class="message message-error">' +

    '❌ ' +

    escapeHtml(
      message
    ) +

    '</div>';

}


/*
 * ==============================================
 * CAMERA MESSAGE
 * ==============================================
 */

function showCameraMessage(
  message,
  type
) {


  const box =
    document.getElementById(
      "cameraMessage"
    );


  let className =
    "message-info";


  if (
    type === "error"
  ) {

    className =
      "message-error";

  }


  if (
    type === "warning"
  ) {

    className =
      "message-warning";

  }


  box.innerHTML =

    '<div class="message ' +
    className +
    '">' +

    message +

    '</div>';

}


/*
 * ==============================================
 * CLEAR CAMERA MESSAGE
 * ==============================================
 */

function clearCameraMessage() {


  document
    .getElementById(
      "cameraMessage"
    )
    .innerHTML =
    "";

}


/*
 * ==============================================
 * HTML ESCAPE
 * ==============================================
 */

function escapeHtml(
  value
) {

  return String(
    value == null
      ? ""
      : value
  )

  .replace(
    /&/g,
    "&amp;"
  )

  .replace(
    /</g,
    "&lt;"
  )

  .replace(
    />/g,
    "&gt;"
  )

  .replace(
    /"/g,
    "&quot;"
  )

  .replace(
    /'/g,
    "&#039;"
  );

}


/*
 * ==============================================
 * ATTRIBUTE ESCAPE
 * ==============================================
 */

function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );

}
