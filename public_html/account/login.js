/**
 * @AUTHOR: Param - Jiaxi - Evan
 * @FILE: script.js
 * @Instructor: Ben Dicken
 * @ASSIGNMENT: Final Project - Wordle
 * @COURSE: CSc 337; Spring 2023
 * @Purpose: Holds login and create account funcitonality
 */

function login() {
  let u = $("#username").val();
  let p = $("#password").val();
  $.get("/account/login/" + u + "/" + encodeURIComponent(p), (data, status) => {
    alert(data);
    if (data == "SUCCESS") {
      window.location.href = "/app/wordle.html";
    }
  });
}

function createAccount() {
  let u = $("#create-username").val();
  let p = $("#create-password").val();
  $.get(
    "/account/create/" + u + "/" + encodeURIComponent(p),
    (data, status) => {
      alert(data);
    }
  );
}