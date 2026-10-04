/************************************************
 * VIKAS SAPTAH '26
 * VERCEL QR SCANNER
 ************************************************/


/*
 * ==============================================
 * APPS SCRIPT WEB APP URL
 * ==============================================
 *
 * Example:
 *
 * https://script.google.com/macros/s/XXXX/exec
 *
 */

const API_URL =
  "https://script.google.com/macros/s/AKfycbxrdxRVTELEvcbTa-5FONwyzLcToyfRJZYBpWk5fqsHYPxPSd0BBY2lTTw3rkMN4TXU/exec";


/*
 * ==============================================
 * SCANNER VARIABLES
 * ==============================================
 */

let qrScanner = null;

let scannerRunning = false;

let lastScannedId = "";

let lastScanTime = 0;


/*
 * ==============================================
 * START SCANNER
 * ==============================================
 */

async function startScanner() {


  if (scannerRunning) {

    return;

  }


  const status =
    document.getElementById(
      "scannerStatus"
    );


  status.innerText =
    "Requesting camera permission...";


  try {


    if (!qrScanner) {

      qrScanner =
        new Html5Qrcode(
          "reader"
        );

    }


    await qrScanner.start(

      {
        facingMode: {
          exact: "environment"
        }
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


    scannerRunning =
      true;


    document
      .getElementById(
        "startScannerBtn"
      )
      .classList
      .add("hidden");


    document
      .getElementById(
        "stopScannerBtn"
      )
      .classList
      .remove("hidden");


    status.innerText =
      "📷 Camera active — scan QR";


  }


  catch (error) {


    console.log(
      "Back camera failed:",
      error
    );


    /*
     * FALLBACK
     */

    try {


      const cameras =
        await Html5Qrcode.getCameras();


      if (
        !cameras ||
        cameras.length === 0
      ) {

        throw new Error(
          "No camera found."
        );

      }


      let camera =
        cameras.find(
          function(item) {

            const label =
              (
                item.label ||
                ""
              ).toLowerCase();


            return (
              label.includes("back") ||
              label.includes("rear") ||
              label.includes("environment")
            );

          }
        );


      if (!camera) {

        camera =
          cameras[0];

      }


      await qrScanner.start(

        camera.id,


        {

          fps: 10,

          qrbox: {
            width: 280,
            height: 280
          }

        },


        onScanSuccess,


        onScanFailure

      );


      scannerRunning =
        true;


      document
        .getElementById(
          "startScannerBtn"
        )
        .classList
        .add("hidden");


      document
        .getElementById(
          "stopScannerBtn"
        )
        .classList
        .remove("hidden");


      status.innerText =
        "📷 Camera active — scan QR";


    }


    catch (finalError) {


      console.error(
        finalError
      );


      status.innerText =
        "❌ Camera could not start";


      alert(
        "Camera could not start. Please allow camera permission and try again."
      );

    }

  }

}


/*
 * ==============================================
 * QR SCAN SUCCESS
 * ==============================================
 */

async function onScanSuccess(
  decodedText
) {


  const now =
    Date.now();


  /*
   * Prevent repeated scans
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


  if (match) {

    registrationId =
      match[0].toUpperCase();

  }


  /*
   * Put ID into field
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
   * Find attendee automatically
   */

  findAttendee();

}


/*
 * ==============================================
 * SCAN FAILURE
 * ==============================================
 */

function onScanFailure(
  error
) {

  /*
   * Do nothing.
   *
   * This fires continuously when
   * no QR is detected.
   */

}


/*
 * ==============================================
 * STOP SCANNER
 * ==============================================
 */

async function stopScanner() {


  if (
    !qrScanner ||
    !scannerRunning
  ) {

    return;

  }


  try {

    await qrScanner.stop();

  }

  catch (error) {

    console.log(
      "Stop error:",
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
    .remove("hidden");


  document
    .getElementById(
      "stopScannerBtn"
    )
    .classList
    .add("hidden");


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


  const id =
    document
      .getElementById(
        "registrationId"
      )
      .value
      .trim()
      .toUpperCase();


  if (!id) {

    showError(
      "Please scan a QR or enter Registration ID."
    );

    return;

  }


  showLoading();


  apiCall(

    "find",

    {
      id: id
    },

    function(response) {


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


  if (!certificateName) {

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


    function(response) {


      if (
        !response ||
        !response.success
      ) {


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
 * COLLECT GOODIE
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


    function(response) {


      if (
        !response ||
        !response.success
      ) {


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

            : "Goodie update failed."

        );


        return;

      }


      renderAttendee(
        response.data
      );


      showSuccess(
        "🎁 Goodie marked as collected."
      );

    }

  );

}


/*
 * ==============================================
 * API CALL - JSONP
 * ==============================================
 */

function apiCall(
  action,
  params,
  callback
) {


  const callbackName =
    "apiCallback_" +
    Date.now() +
    "_" +
    Math.floor(
      Math.random() * 10000
    );


  window[callbackName] =
    function(response) {


      try {

        callback(response);

      }

      finally {

        delete window[
          callbackName
        ];

        if (
          script.parentNode
        ) {

          script.parentNode
            .removeChild(script);

        }

      }

    };


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
    function(key) {

      query.append(
        key,
        params[key]
      );

    }
  );


  const script =
    document.createElement(
      "script"
    );


  script.src =
    API_URL +
    "?" +
    query.toString();


  script.onerror =
    function() {


      delete window[
        callbackName
      ];


      if (
        script.parentNode
      ) {

        script.parentNode
          .removeChild(script);

      }


      showError(
        "Unable to connect to server."
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

    '<b>Attendance:</b> ' +

    escapeHtml(
      data.attendanceType || "-"
    ) +

    '</div>';


  /*
   * ============================================
   * FIRST VISIT
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

      '<label>' +

      'Certificate Name' +

      '</label>';


    html +=

      '<input ' +

      'id="certificateName" ' +

      'value="' +

      escapeAttribute(

        data.certificateName ||

        data.name ||

        ""

      ) +

      '">';


    html +=

      '<button ' +

      'class="btn btn-success" ' +

      'onclick="checkIn(\\'' +

      escapeJs(
        data.registrationId
      ) +

      '\\')">' +

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

      'class="btn btn-warning" ' +

      'onclick="collectGoodie(\\'' +

      escapeJs(
        data.registrationId
      ) +

      '\\')">' +

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

      '<b>Goodie:</b><br>' +

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
    .remove("hidden");


  document
    .getElementById(
      "result"
    )
    .innerHTML =

    '<div class="message">' +

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
    .remove("hidden");


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
    .remove("hidden");


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
    .remove("hidden");


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
 * ESCAPE HTML
 * ==============================================
 */

function escapeHtml(
  value
) {

  return String(
    value || ""
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
 * ESCAPE ATTRIBUTE
 * ==============================================
 */

function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );

}


/*
 * ==============================================
 * ESCAPE JS
 * ==============================================
 */

function escapeJs(
  value
) {

  return String(
    value || ""
  )

  .replace(
    /\\/g,
    "\\\\"
  )

  .replace(
    /'/g,
    "\\'"
  )

  .replace(
    /"/g,
    '\\"'
  );

}
