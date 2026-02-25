// attendance-cli.js
// Usage:
//   node attendance-cli.js username password
// or set env vars:
//   NCU_USER=23csu337 NCU_PASS=password node attendance-cli.js

const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

const LOGIN_URL = "https://uatapi.ncuindia.edu/api/Authentication/ValidateUser";
const ATTENDANCE_URL =
  "https://uatapi.ncuindia.edu/api/myapp/Registration/GetAttendanceSummary?userId=-1mNylX0ATFvklWCQjB6qIAfILzYAVIXR9fx4a9lSHI=";

const argvUser = process.argv[2];
const argvPass = process.argv[3];

const USERNAME = argvUser || process.env.NCU_USER;
const PASSWORD = argvPass || process.env.NCU_PASS;

if (!USERNAME || !PASSWORD) {
  console.error("Usage: node attendance-cli.js <username> <password>");
  console.error("Or set environment variables NCU_USER and NCU_PASS.");
  process.exit(2);
}

const loginPayload = {
  UserName: USERNAME,
  Password: PASSWORD,
  IpAddress: "",
  UserType: "",
};

const LOGIN_HEADERS = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Content-Type": "application/json",
  Origin: "https://mycampus.ncuindia.edu",
  Referer: "https://mycampus.ncuindia.edu/",
  DNT: "1",
  // curl example sent Authorization: Bearer null — keep same for parity
  Authorization: "Bearer null",
};

function extractToken(loginData) {
  const tries = [
    loginData?.token,
    loginData?.Token,
    loginData?.jwt,
    loginData?.JWT,
    loginData?.accessToken,
    loginData?.AccessToken,
    loginData?.result?.token,
    loginData?.Result?.token,
    loginData?.Result?.Token,
    loginData?.Result?.Data?.Token,
    loginData?.Result?.Data?.token,
    loginData?.Result?.Data?.accessToken,
    loginData?.Result?.Data?.access_token,
    loginData?.data?.token,
    loginData?.data?.accessToken,
    loginData?.Data?.token, // sometimes uppercase
    loginData?.Data?.accessToken,
  ];

  for (const t of tries) {
    if (typeof t === "string" && t.trim().length > 0) return t.trim();
  }

  if (typeof loginData === "string" && loginData.trim().length > 0)
    return loginData.trim();

  return null;
}

async function loginAndGetToken() {
  try {
    const res = await axios.post(LOGIN_URL, loginPayload, {
      headers: LOGIN_HEADERS,
      timeout: 15000,
    });

    const body = res.data;
    const token = extractToken(body);

    if (!token) {
      // Save full response for debugging
      const savePath = path.join(__dirname, "login_response.json");
      await fs.writeFile(savePath, JSON.stringify(body, null, 2), "utf8");
      throw new Error(
        `Could not find token in login response. Saved login response to ${savePath}`
      );
    }

    return token;
  } catch (err) {
    if (err.response) {
      const dump = JSON.stringify(err.response.data, null, 2);
      console.error(
        "Login failed:",
        err.response.status,
        err.response.statusText
      );
      console.error("Response body:", dump);
      await fs.writeFile(
        path.join(__dirname, "login_error_response.json"),
        dump,
        "utf8"
      );
    } else {
      console.error("Login error:", err.message);
    }
    throw err;
  }
}

async function fetchAttendance(token) {
  try {
    const headers = {
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Origin: "https://mycampus.ncuindia.edu",
      Referer: "https://mycampus.ncuindia.edu/",
    };

    const res = await axios.get(ATTENDANCE_URL, {
      headers,
      timeout: 15000,
    });

    return res.data;
  } catch (err) {
    if (err.response) {
      const dump = JSON.stringify(err.response.data, null, 2);
      console.error(
        "Attendance fetch failed:",
        err.response.status,
        err.response.statusText
      );
      console.error("Response body:", dump);
      await fs.writeFile(
        path.join(__dirname, "attendance_error_response.json"),
        dump,
        "utf8"
      );
    } else {
      console.error("Attendance fetch error:", err.message);
    }
    throw err;
  }
}

function parseAttendanceResponse(resp) {
  // Your example had Data as a string containing JSON array.
  // Handle both cases: resp.Data is stringified JSON or already an object/array.
  let arr = null;

  if (resp == null) return [];

  const maybe = resp.Data ?? resp.data ?? resp;

  if (!maybe) return [];

  if (typeof maybe === "string") {
    try {
      arr = JSON.parse(maybe);
    } catch (e) {
      // maybe it's wrapped differently
      try {
        // attempt to JSON.parse the whole resp
        arr = JSON.parse(JSON.stringify(resp));
      } catch {
        arr = [];
      }
    }
  } else if (Array.isArray(maybe)) {
    arr = maybe;
  } else if (typeof maybe === "object" && Array.isArray(maybe.Data)) {
    arr = maybe.Data;
  } else {
    // fallback: if resp itself is an array
    if (Array.isArray(resp)) arr = resp;
    else arr = [];
  }

  return arr;
}

function prettyPrint(attArr) {
  if (!Array.isArray(attArr) || attArr.length === 0) {
    console.log("No attendance records found.");
    return;
  }

  // Select and normalize columns to show
  const table = attArr.map((r) => ({
    CourseCode: r.CourseCode ?? r.courseCode ?? "",
    CourseName: r.CourseName ?? r.courseName ?? r.CourseTitle ?? "",
    TotalLectures:
      r.TotalLectures ?? r.totalLectures ?? r.TotalLecturesTaken ?? 0,
    TotalPresent: r.TotalPresent ?? r.totalPresent ?? 0,
    TotalAbsent: r.TotalAbsent ?? r.totalAbsent ?? 0,
    LOA: r.TotalLOA ?? r.TotalLoa ?? 0,
    OnDuty: r.TotalOnDuty ?? r.TotalOnDuty ?? 0,
    Percentage:
      (typeof r.Percentage1 !== "undefined" ? r.Percentage1 : r.Percentage) ??
      r.Percentage ??
      "",
  }));

  console.log("\nAttendance Summary:\n");
  console.table(table);
}

(async () => {
  try {
    console.log("Logging in as", USERNAME, "...");
    const token = await loginAndGetToken();
    console.log(
      "Got token (truncated):",
      token.slice(0, 60) + (token.length > 60 ? "…" : "")
    );

    console.log("Fetching attendance...");
    const attendanceResp = await fetchAttendance(token);

    // Save raw response for records
    await fs.writeFile(
      path.join(__dirname, "attendance_raw.json"),
      JSON.stringify(attendanceResp, null, 2),
      "utf8"
    );

    const arr = parseAttendanceResponse(attendanceResp);
    prettyPrint(arr);

    // Save parsed array as well
    await fs.writeFile(
      path.join(__dirname, "attendance.json"),
      JSON.stringify(arr, null, 2),
      "utf8"
    );
    console.log("\nSaved parsed attendance to attendance.json");
  } catch (err) {
    console.error("\nScript terminated with error.");
    process.exitCode = 1;
  }
})();
