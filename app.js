/************************************************
 * VIKAS SAPTAH '26
 * QR SCANNER + GOOGLE SHEET BACKEND
 ************************************************/


/* ==============================================
   GOOGLE APPS SCRIPT API
============================================== */

const API_URL =
  "https://script.google.com/macros/s/AKfycbxdUeD5zO2t8VWnY7npyq-EdJMXNbe-_0n4ruOlmyh5nn2Q7oNa9MCah-_EWDylGx2HjQ/exec";


/* ==============================================
   GLOBAL VARIABLES
============================================== */

let qrScanner = null;

let scannerRunning = false;

let lastScannedId = "";

let lastScanTime = 0;

let apiRequestRunning = false;


/* ==============================================
   PAGE LOAD
============================================== */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    console.log(
      "VIKAS SAPTAH SCANNER LOADED"
    );


    const startButton =
      document.getElementById(
        "startScannerBtn"
      );

    const stopButton =
      document.getElementById(
        "stopScannerBtn"
      );

    const findButton =
      document.getElementById(
        "findBtn"
      );

    const registrationInput =
      document.getElementById(
        "registrationId"
      );


    if (!startButton) {

      console.error(
        "startScannerBtn not found."
      );

      return;

    }


    if (!stopButton) {

      console.error(
        "stopScannerBtn not found."
      );

      return;

    }


    if (!findButton) {

      console.error(
        "findBtn not found."
      );

      return;

    }


    startButton.addEventListener(
      "click",
      startScanner
    );


    stopButton.addEventListener(
      "click",
      stopScanner
    );


    findButton.addEventListener(
      "click",
      function () {

        findAttendee();

      }
    );


    if (registrationInput) {

      registrationInput.addEventListener(
        "keydown",
        function (event) {

          if (
            event.key === "Enter"
          ) {

            event.preventDefault();

            findAttendee();

          }

        }
      );

    }


    console.log(
      "All buttons initialized."
    );

  }
);


/* ==============================================
   START SCANNER
============================================== */

async function startScanner() {

  const status =
    document.getElementById(
      "scannerStatus"
    );


  if (
    typeof Html5Qrcode ===
    "undefined"
  ) {

    showCameraMessage(
      "QR scanner library could not load. Please refresh the page.",
      "error"
    );

    return;

  }


  if (scannerRunning) {

    return;

  }


  status.innerText =
    "Requesting camera permission...";


  clearCameraMessage();


  try {

    if (!qrScanner) {

      qrScanner =
        new Html5Qrcode(
          "reader"
        );

    }


    await qrScanner.start(

      {
        facingMode:
          "environment"
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


  catch (primaryError) {

    console.warn(
      "Primary camera failed:",
      primaryError
    );


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


      let selectedCamera =
        cameras.find(
          function (camera) {

            const label =
              String(
                camera.label || ""
              ).toLowerCase();


            return (
              label.includes("back") ||
              label.includes("rear") ||
              label.includes("environment")
            );

          }
        );


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
        "Please allow camera permission and make sure the website is using HTTPS.",
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


  document
    .getElementById(
      "scannerStatus"
    )
    .innerText =
      "Camera active - point at QR";


  clearCameraMessage();

}


/* ==============================================
   QR SUCCESS
============================================== */

async function onScanSuccess(
  decodedText
) {

  console.log(
    "QR SCANNED:",
    decodedText
  );


  const now =
    Date.now();


  if (
    decodedText ===
      lastScannedId &&
    now - lastScanTime < 3000
  ) {

    return;

  }


  lastScannedId =
    decodedText;

  lastScanTime =
    now;


  let registrationId =
    String(decodedText)
      .trim()
      .toUpperCase();


  const match =
    registrationId.match(
      /VS26-\d+/i
    );


  if (!match) {

    showError(
      "Invalid QR code. Registration QR must contain a valid VS26 ID."
    );

    return;

  }


  registrationId =
    match[0].toUpperCase();


  document
    .getElementById(
      "registrationId"
    )
    .value =
      registrationId.replace(
/^VS26-/i,
""
);


  await stopScanner();


  document
    .getElementById(
      "scannerStatus"
    )
    .innerText =
      "QR scanned: " +
      registrationId;


  findAttendee();

}


/* ==============================================
   QR FAILURE
============================================== */

function onScanFailure() {

  // Continuous QR failures are normal.
  // Do nothing.

}


/* ==============================================
   STOP SCANNER
============================================== */

async function stopScanner() {

  if (
    !qrScanner
  ) {

    scannerRunning =
      false;

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

    console.warn(
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


/* ==============================================
   FIND ATTENDEE
============================================== */

function findAttendee() {

  const input =
    document.getElementById(
      "registrationId"
    );


  if (!input) {

    return;

  }


  const number =
  input.value
    .trim();


if (!number) {

  showError(
    "Please scan a QR code or enter Registration ID."
  );

  return;

}


if (
  !/^\d+$/.test(number)
) {

  showError(
    "Please enter a valid Registration number."
  );

  return;

}


const id =
  "VS26-" +
  number;

  if (
    apiRequestRunning
  ) {

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


      if (
        !response.success
      ) {

        showError(
          response.message ||
          "Registration not found."
        );

        return;

      }


      const attendee =
        response.data ||
        response;


      if (
        !attendee.registrationId
      ) {

        showError(
          "Registration found but attendee data is invalid."
        );

        return;

      }


      renderAttendee(
        attendee
      );

    }

  );

}


/* ==============================================
   CHECK IN
============================================== */

function checkIn(id) {

  if (!id) {

    return;

  }


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


      if (!response) {

        showError(
          "No response from server."
        );

        return;

      }


      if (
        !response.success
      ) {

        showError(
          response.message ||
          "Check-in failed."
        );

        return;

      }


      const attendee =
        response.data ||
        response;


      /*
       * IMPORTANT:
       * Render fresh backend data.
       */

      renderAttendee(
        attendee
      );


      if (
        response.alreadyCheckedIn
      ) {

        showWarning(
          "Participant is already checked in."
        );

      }

      else {

        showSuccess(
          "CHECK-IN COMPLETED SUCCESSFULLY"
        );

      }

    }

  );

}


/* ==============================================
   COLLECT KIT / GOODIE
============================================== */

function collectGoodie(id) {

  if (!id) {

    return;

  }


  showLoading();


  apiCall(

    "goodie",

    {
      id: id
    },

    function (response) {

      console.log(
        "KIT RESPONSE:",
        response
      );


      if (!response) {

        showError(
          "No response from server."
        );

        return;

      }


      if (
        !response.success
      ) {

        showError(
          response.message ||
          "Kit collection failed."
        );

        return;

      }


      const attendee =
        response.data ||
        response;


      /*
       * Render fresh backend data.
       */

      renderAttendee(
        attendee
      );


      if (
        response.alreadyCollected
      ) {

        showWarning(
          "Registration kit was already collected."
        );

      }

      else {

        showSuccess(
          "REGISTRATION KIT COLLECTED"
        );

      }

    }

  );

}


/* ==============================================
   API CALL - JSONP
============================================== */

function apiCall(
  action,
  params,
  callback
) {

  if (
    !API_URL ||
    API_URL.includes(
      "PASTE_YOUR"
    )
  ) {

    showError(
      "Apps Script API URL is not configured."
    );

    return;

  }


  apiRequestRunning =
    true;


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


  let finished =
    false;


  const cleanup =
    function () {

      if (
        finished
      ) {

        return;

      }


      finished =
        true;


      apiRequestRunning =
        false;


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

    };


  window[
    callbackName
  ] =
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

      catch (error) {

        console.error(
          "Callback error:",
          error
        );

        showError(
          "Unable to process server response."
        );

      }

      finally {

        cleanup();

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
    function (key) {

      query.append(
        key,
        params[key]
      );

    }
  );


  const finalUrl =
    API_URL +
    "?" +
    query.toString();


  console.log(
    "API REQUEST:",
    finalUrl
  );


  script.src =
    finalUrl;


  script.async =
    true;


  script.onerror =
    function () {

      console.error(
        "Apps Script API request failed."
      );


      cleanup();


      showError(
        "Unable to connect to Google Apps Script."
      );

    };


  document.body.appendChild(
    script
  );


  /*
   * Safety timeout.
   * Prevents UI from getting stuck forever.
   */

  setTimeout(
    function () {

      if (!finished) {

        cleanup();

        showError(
          "Google Apps Script response timed out."
        );

      }

    },
    15000
  );

}


/* ==============================================
   RENDER ATTENDEE
============================================== */

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


  if (
    !card ||
    !result
  ) {

    return;

  }


  card.classList.remove(
    "hidden"
  );


  /*
   * Normalize CHECK-IN status.
   *
   * Supports:
   * Checked In
   * checked in
   * DONE
   * YES
   * Completed
   */

  const rawCheckIn =
    String(
      data.checkInStatus ||
      ""
    )
      .trim()
      .toLowerCase();


  const checkInDone =
    rawCheckIn ===
      "checked in" ||

    rawCheckIn ===
      "done" ||

    rawCheckIn ===
      "yes" ||

    rawCheckIn ===
      "completed";


  /*
   * Normalize KIT status.
   *
   * Supports:
   * Collected
   * collected
   * DONE
   * YES
   * Completed
   */

  const rawKit =
    String(
      data.kitStatus ||
      data.goodieStatus ||
      data.registrationKit ||
      ""
    )
      .trim()
      .toLowerCase();


  const kitDone =
    rawKit ===
      "collected" ||

    rawKit ===
      "done" ||

    rawKit ===
      "yes" ||

    rawKit ===
      "completed";


  let html =
    "";


  html +=
    '<div class="attendee">';


  /* NAME */

  html +=
    '<div class="attendee-name">' +

    escapeHtml(
      data.name ||
      "-"
    ) +

    '</div>';


  /* REGISTRATION ID */

  html +=
    '<div class="registration-id">' +

    escapeHtml(
      data.registrationId ||
      "-"
    ) +

    '</div>';


  /* EMAIL */

  html +=
    '<div class="info">' +

    '<b>Email:</b> ' +

    escapeHtml(
      data.email ||
      "-"
    ) +

    '</div>';


  /* MOBILE */

  html +=
    '<div class="info">' +

    '<b>Mobile:</b> ' +

    escapeHtml(
      data.contact ||
      data.mobile ||
      "-"
    ) +

    '</div>';


  /* ORGANIZATION */

  html +=
    '<div class="info">' +

    '<b>Organization:</b> ' +

    escapeHtml(
      data.organization ||
      "-"
    ) +

    '</div>';


  /*
   * =========================================
   * STAGE 1
   * CHECK-IN PENDING
   * =========================================
   */

  if (
    !checkInDone
  ) {

    html +=
      '<div class="status status-pending">' +

      'CHECK-IN PENDING' +

      '</div>';


    html +=
      '<div class="status status-pending">' +

      'REGISTRATION KIT PENDING' +

      '</div>';


    html +=
      '<button ' +

      'id="checkInBtn" ' +

      'type="button" ' +

      'class="btn btn-success">' +

      'CHECK IN' +

      '</button>';

  }


  /*
   * =========================================
   * STAGE 2
   * CHECK-IN DONE
   * KIT PENDING
   * =========================================
   */

  else if (
    !kitDone
  ) {

    html +=
      '<div class="status status-checked">' +

      'CHECK-IN DONE' +

      '<br><br>' +

      '<span class="small">' +

      'Check-In Time:<br>' +

      escapeHtml(
        data.checkInTime ||
        "-"
      ) +

      '</span>' +

      '</div>';


    html +=
      '<div class="status status-pending">' +

      'REGISTRATION KIT PENDING' +

      '</div>';


    html +=
      '<button ' +

      'id="goodieBtn" ' +

      'type="button" ' +

      'class="btn btn-warning">' +

      'COLLECT KIT' +

      '</button>';

  }


  /*
   * =========================================
   * STAGE 3
   * BOTH DONE
   * =========================================
   */

  else {

    html +=
      '<div class="status status-checked">' +

      'CHECK-IN DONE' +

      '<br><br>' +

      '<span class="small">' +

      'Check-In Time:<br>' +

      escapeHtml(
        data.checkInTime ||
        "-"
      ) +

      '</span>' +

      '</div>';


    html +=
      '<div class="status status-checked">' +

      'REGISTRATION KIT COLLECTED' +

      '<br><br>' +

      '<span class="small">' +

      'Collection Time:<br>' +

      escapeHtml(
        data.kitTime ||
        data.goodieTime ||
        data.registrationKitTime ||
        "-"
      ) +

      '</span>' +

      '</div>';


    html +=
      '<div class="status status-completed">' +

      'ALL DONE' +

      '<br>' +

      '<span class="small">' +

      'No further action required' +

      '</span>' +

      '</div>';

  }


  html +=
    '</div>';


  result.innerHTML =
    html;


  /*
   * =========================================
   * CHECK-IN BUTTON
   * =========================================
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
   * =========================================
   * KIT BUTTON
   * =========================================
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


/* ==============================================
   LOADING
============================================== */

function showLoading() {

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


  result.innerHTML =
    '<div class="message message-info">' +

    'Processing...' +

    '</div>';

}


/* ==============================================
   SUCCESS
============================================== */

function showSuccess(
  message
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


  result.insertAdjacentHTML(

    "afterbegin",

    '<div class="message message-success">' +

    escapeHtml(
      message
    ) +

    '</div>'

  );

}


/* ==============================================
   WARNING
============================================== */

function showWarning(
  message
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


  result.insertAdjacentHTML(

    "afterbegin",

    '<div class="message message-warning">' +

    escapeHtml(
      message
    ) +

    '</div>'

  );

}


/* ==============================================
   ERROR
============================================== */

function showError(
  message
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


  result.innerHTML =

    '<div class="message message-error">' +

    'ERROR: ' +

    escapeHtml(
      message
    ) +

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


  if (!box) {

    return;

  }


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


/* ==============================================
   CLEAR CAMERA MESSAGE
============================================== */

function clearCameraMessage() {

  const box =
    document.getElementById(
      "cameraMessage"
    );


  if (box) {

    box.innerHTML =
      "";

  }

}


/* ==============================================
   HTML ESCAPE
============================================== */

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
