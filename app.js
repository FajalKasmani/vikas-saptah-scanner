/************************************************
 * VIKAS SAPTAH '26
 * QR SCANNER + GOOGLE SHEET BACKEND
 ************************************************/

const API_URL =
  "https://script.google.com/macros/s/AKfycbxdUeD5zO2t8VWnY7npyq-EdJMXNbe-_0n4ruOlmyh5nn2Q7oNa9MCah-_EWDylGx2HjQ/exec";

let qrScanner = null;
let scannerRunning = false;

let lastScannedId = "";
let lastScanTime = 0;


/* ==============================================
   PAGE LOAD
============================================== */

document.addEventListener("DOMContentLoaded", function () {

  console.log("VIKAS SAPTAH SCANNER LOADED");

  document
    .getElementById("startScannerBtn")
    .addEventListener("click", startScanner);

  document
    .getElementById("stopScannerBtn")
    .addEventListener("click", stopScanner);

  document
    .getElementById("findBtn")
    .addEventListener("click", findAttendee);

  document
    .getElementById("registrationId")
    .addEventListener("keydown", function (event) {

      if (event.key === "Enter") {
        findAttendee();
      }

    });

});


/* ==============================================
   START SCANNER
============================================== */

async function startScanner() {

  const status =
    document.getElementById("scannerStatus");

  if (typeof Html5Qrcode === "undefined") {

    showCameraMessage(
      "QR scanner library could not load. Please refresh.",
      "error"
    );

    return;
  }

  if (scannerRunning) {
    return;
  }

  status.innerText =
    "Requesting camera permission...";

  try {

    if (!qrScanner) {

      qrScanner =
        new Html5Qrcode("reader");

    }

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

    console.log("Primary camera error:", error);

    try {

      const cameras =
        await Html5Qrcode.getCameras();

      if (!cameras || cameras.length === 0) {

        throw new Error("No camera found.");

      }

      let selectedCamera =
        cameras.find(function (camera) {

          const label =
            String(camera.label || "")
              .toLowerCase();

          return (
            label.includes("back") ||
            label.includes("rear") ||
            label.includes("environment")
          );

        });

      if (!selectedCamera) {

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
        "Camera could not start";

      showCameraMessage(
        "Camera could not start.<br><br>" +
        "Please allow camera permission and use HTTPS.",
        "error"
      );

    }

  }

}


/* ==============================================
   SCANNER STARTED
============================================== */

function scannerStarted() {

  scannerRunning = true;

  document
    .getElementById("startScannerBtn")
    .classList
    .add("hidden");

  document
    .getElementById("stopScannerBtn")
    .classList
    .remove("hidden");

  document
    .getElementById("scannerStatus")
    .innerText =
    "Camera active - point at QR";

  clearCameraMessage();

}


/* ==============================================
   QR SUCCESS
============================================== */

async function onScanSuccess(decodedText) {

  console.log(
    "QR SCANNED:",
    decodedText
  );

  const now = Date.now();

  if (
    decodedText === lastScannedId &&
    now - lastScanTime < 3000
  ) {

    return;

  }

  lastScannedId = decodedText;
  lastScanTime = now;

  let registrationId =
    String(decodedText)
      .trim()
      .toUpperCase();

  const match =
    registrationId.match(/VS26-\d+/i);

  if (match) {

    registrationId =
      match[0].toUpperCase();

  }

  document
    .getElementById("registrationId")
    .value =
    registrationId;

  await stopScanner();

  document
    .getElementById("scannerStatus")
    .innerText =
    "QR scanned: " +
    registrationId;

  findAttendee();

}


/* ==============================================
   QR FAILURE
============================================== */

function onScanFailure(error) {
  // Ignore continuous scan failures.
}


/* ==============================================
   STOP SCANNER
============================================== */

async function stopScanner() {

  if (!qrScanner) {
    return;
  }

  try {

    if (scannerRunning) {

      await qrScanner.stop();

    }

  }

  catch (error) {

    console.log(
      "Scanner stop:",
      error
    );

  }

  scannerRunning = false;

  document
    .getElementById("startScannerBtn")
    .classList
    .remove("hidden");

  document
    .getElementById("stopScannerBtn")
    .classList
    .add("hidden");

  document
    .getElementById("scannerStatus")
    .innerText =
    "Scanner stopped";

}


/* ==============================================
   FIND ATTENDEE
============================================== */

function findAttendee() {

  const input =
    document.getElementById(
      "registrationId"
    );

  const id =
    input.value
      .trim()
      .toUpperCase();

  if (!id) {

    showError(
      "Please scan a QR code or enter Registration ID."
    );

    return;

  }

  if (!/^VS26-\d+$/i.test(id)) {

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

      if (!response) {

        showError(
          "No response from server."
        );

        return;

      }

      if (!response.success) {

        showError(
          response.message ||
          "Registration not found."
        );

        return;

      }

      /*
       * IMPORTANT:
       * Backend may return attendee data
       * directly OR inside response.data.
       */

      const attendee =
        response.data ||
        response;

      if (!attendee.registrationId) {

        showError(
          "Registration found but attendee data is invalid."
        );

        return;

      }

      renderAttendee(attendee);

    }

  );

}


/* ==============================================
   CHECK IN
============================================== */

function checkIn(id) {

  showLoading();

  apiCall(

    "checkin",

    {
      id: id
    },

    function (response) {

      console.log(
        "CHECK-IN RESPONSE:",
        response
      );

      if (!response || !response.success) {

        if (
          response &&
          response.alreadyCheckedIn
        ) {

          const attendee =
            response.data ||
            response;

          renderAttendee(attendee);

          showWarning(
            "Already Checked In at " +
            (attendee.checkInTime || "-")
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

      const attendee =
        response.data ||
        response;

      renderAttendee(attendee);

      showSuccess(
        "Check-in completed successfully."
      );

    }

  );

}


/* ==============================================
   GOODIE
============================================== */

function collectGoodie(id) {

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

      if (!response || !response.success) {

        if (
          response &&
          response.alreadyCollected
        ) {

          const attendee =
            response.data ||
            response;

          renderAttendee(attendee);

          showWarning(
            "Goodie already collected at " +
            (attendee.goodieTime || "-")
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

      const attendee =
        response.data ||
        response;

      renderAttendee(attendee);

      showSuccess(
        "Goodie collected successfully."
      );

    }

  );

}


/* ==============================================
   API CALL
============================================== */

function apiCall(
  action,
  params,
  callback
) {

  if (
    !API_URL ||
    API_URL.includes("PASTE_YOUR")
  ) {

    showError(
      "Apps Script API URL is not configured."
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
    document.createElement("script");

  window[callbackName] =
    function (response) {

      console.log(
        "API RESPONSE:",
        response
      );

      try {

        callback(response);

      }

      finally {

        delete window[callbackName];

        if (script.parentNode) {

          script.parentNode.removeChild(
            script
          );

        }

      }

    };

  const query =
    new URLSearchParams();

  /*
   * Apps Script API
   */

  query.append(
    "api",
    action
  );

  query.append(
    "callback",
    callbackName
  );

  Object.keys(params || {})
    .forEach(function (key) {

      query.append(
        key,
        params[key]
      );

    });

  const finalUrl =
    API_URL +
    "?" +
    query.toString();

  console.log(
    "API REQUEST:",
    finalUrl
  );

  script.src = finalUrl;

  script.onerror =
    function () {

      console.error(
        "API request failed"
      );

      delete window[callbackName];

      if (script.parentNode) {

        script.parentNode.removeChild(
          script
        );

      }

      showError(
        "Unable to connect to Google Apps Script."
      );

    };

  document.body.appendChild(script);

}


/* ==============================================
   RENDER ATTENDEE
============================================== */

function renderAttendee(data) {

  const card =
    document.getElementById(
      "resultCard"
    );

  const result =
    document.getElementById(
      "result"
    );

  card.classList.remove("hidden");

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
      data.mobile ||
      data.contact ||
      "-"
    ) +
    '</div>';

  html +=
    '<div class="info">' +
    '<b>Organization:</b> ' +
    escapeHtml(
      data.organization ||
      "-"
    ) +
    '</div>';

  /*
   * CHECK-IN PENDING
   */

  if (
    data.checkInStatus !==
    "Checked In"
  ) {

    html +=
      '<div class="status status-pending">' +
      'CHECK-IN PENDING' +
      '</div>';

    html +=
      '<button ' +
      'id="checkInBtn" ' +
      'class="btn btn-success">' +
      'CHECK IN' +
      '</button>';

  }

  /*
   * CHECKED IN / GOODIE PENDING
   */

  else if (
    data.goodieStatus !==
    "Collected"
  ) {

    html +=
      '<div class="status status-checked">' +
      'ALREADY CHECKED IN' +
      '<br><br>' +
      '<span class="small">' +
      'Check-in Time: ' +
      escapeHtml(
        data.checkInTime || "-"
      ) +
      '</span>' +
      '</div>';

    html +=
      '<div class="status status-pending">' +
      'GOODIE PENDING' +
      '</div>';

    html +=
      '<button ' +
      'id="goodieBtn" ' +
      'class="btn btn-warning">' +
      'COLLECT GOODIE' +
      '</button>';

  }

  /*
   * FULLY COMPLETED
   */

  else {

    html +=
      '<div class="status status-completed">' +
      'FULLY COMPLETED' +
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
        data.goodieTime ||
        data.registrationKitTime ||
        "-"
      ) +
      '</div>';

    html +=
      '<div class="message message-warning">' +
      'NO ACTION REQUIRED' +
      '</div>';

  }

  html +=
    '</div>';

  result.innerHTML =
    html;


  /*
   * CHECK-IN BUTTON
   */

  const checkInBtn =
    document.getElementById(
      "checkInBtn"
    );

  if (checkInBtn) {

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
   * GOODIE BUTTON
   */

  const goodieBtn =
    document.getElementById(
      "goodieBtn"
    );

  if (goodieBtn) {

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


/* ==============================================
   LOADING
============================================== */

function showLoading() {

  document
    .getElementById("resultCard")
    .classList
    .remove("hidden");

  document
    .getElementById("result")
    .innerHTML =
    '<div class="message message-info">' +
    'Processing...' +
    '</div>';

}


/* ==============================================
   SUCCESS
============================================== */

function showSuccess(message) {

  document
    .getElementById("resultCard")
    .classList
    .remove("hidden");

  document
    .getElementById("result")
    .insertAdjacentHTML(
      "afterbegin",

      '<div class="message message-success">' +
      escapeHtml(message) +
      '</div>'
    );

}


/* ==============================================
   WARNING
============================================== */

function showWarning(message) {

  document
    .getElementById("resultCard")
    .classList
    .remove("hidden");

  document
    .getElementById("result")
    .insertAdjacentHTML(
      "afterbegin",

      '<div class="message message-warning">' +
      escapeHtml(message) +
      '</div>'
    );

}


/* ==============================================
   ERROR
============================================== */

function showError(message) {

  document
    .getElementById("resultCard")
    .classList
    .remove("hidden");

  document
    .getElementById("result")
    .innerHTML =
    '<div class="message message-error">' +
    'ERROR: ' +
    escapeHtml(message) +
    '</div>';

}


/* ==============================================
   CAMERA MESSAGE
============================================== */

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

  if (type === "error") {

    className =
      "message-error";

  }

  if (type === "warning") {

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


/* ==============================================
   CLEAR CAMERA MESSAGE
============================================== */

function clearCameraMessage() {

  document
    .getElementById(
      "cameraMessage"
    )
    .innerHTML = "";

}


/* ==============================================
   HTML ESCAPE
============================================== */

function escapeHtml(value) {

  return String(
    value == null
      ? ""
      : value
  )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}
