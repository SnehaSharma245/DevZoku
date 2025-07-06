"use client";
import React from "react";

const Home = () => {
  const handleNavigation = () => {
    window.location.href = "/auth/login";
  };
  return (
    <>
      <button onClick={handleNavigation}>Go to Login Page</button>
    </>
  );
};

export default Home;
